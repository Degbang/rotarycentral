import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ProjectEditorInput } from '@/data/model';
import { getProjectById, listClubs, listThemes, saveProject } from '@/data/api';
import { useAuth } from '@/features/auth';
import { clubNameIsIncluded, titleUsesRotaryWords } from '@/features/brandRules';
import { canEditProject } from '@/features/permissions';
import { Button, Card, Field, InlineSearchSelectField, MetaList, PageHeader, SelectField, StatusBadge, Stepper, TextArea, TextInput } from '@/ui/components';
import { UploadField } from '@/ui/upload-field';
import { formatDateLabel, formatStatusLabel } from '@/ui/formatters';

const projectSchema = z.object({
  title: z.string().min(3, 'Enter a project title.'),
  clubId: z.string().min(1, 'Choose a club.'),
  themeId: z.string().min(1, 'Choose a theme.'),
  projectStatus: z.enum(['Planning', 'Active', 'Completed', 'Paused']),
  location: z.string().min(3, 'Enter a location.'),
  startDate: z.string().min(1, 'Choose a start date.'),
  description: z.string().min(20, 'Add a project description with enough detail.'),
  coverImage: z.any().nullable().optional(),
  images: z.array(z.any()),
  documents: z.array(z.any()),
});

const steps = [
  { title: 'Basic info', description: 'Project title and summary.' },
  { title: 'Status and location', description: 'Club, theme, stage, and place.' },
  { title: 'Media and attachments', description: 'Cover, photos, and supporting PDFs.' },
  { title: 'Review and publish', description: 'Check everything before saving.' },
];

const stepFields: Array<Array<keyof ProjectEditorInput>> = [
  ['title', 'description'],
  ['clubId', 'themeId', 'projectStatus', 'location', 'startDate'],
  [],
  ['title', 'clubId', 'themeId', 'projectStatus', 'location', 'startDate', 'description'],
];

const emptyValues: ProjectEditorInput = {
  title: '',
  clubId: '',
  themeId: '',
  projectStatus: 'Planning',
  location: '',
  startDate: '',
  description: '',
  coverImage: null,
  images: [],
  documents: [],
};

export function ProjectEditorPage() {
  const { projectId } = useParams();
  const isEditing = Boolean(projectId);
  const { session, hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const themesQuery = useQuery({ queryKey: ['themes'], queryFn: listThemes });
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(session!, projectId!),
    enabled: Boolean(session && projectId),
  });

  type ProjectFormValues = z.infer<typeof projectSchema>;

  const {
    register,
    reset,
    watch,
    trigger,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!session) {
      return;
    }

    if (!isEditing) {
      reset({
        ...emptyValues,
        clubId: session.clubIds[0] ?? clubsQuery.data?.[0]?.id ?? '',
        themeId: themesQuery.data?.[0]?.id ?? '',
      });
    }
  }, [clubsQuery.data, isEditing, reset, session, themesQuery.data]);

  useEffect(() => {
    if (projectQuery.data) {
      reset({
        title: projectQuery.data.title,
        clubId: projectQuery.data.clubId,
        themeId: projectQuery.data.themeId,
        projectStatus: projectQuery.data.projectStatus,
        location: projectQuery.data.location,
        startDate: projectQuery.data.startDate,
        description: projectQuery.data.description,
        coverImage: projectQuery.data.coverImage ?? null,
        images: projectQuery.data.images,
        documents: projectQuery.data.documents,
      });
    }
  }, [projectQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProjectEditorInput) => saveProject(session!, values, 'PUBLISHED', projectId),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['project', record.id] });
      navigate(`/projects/${record.id}`);
    },
  });

  if (!session) {
    return null;
  }

  const activeSession = session;

  if (projectQuery.data && !canEditProject(activeSession, projectQuery.data)) {
    return <NavigateToAccessDenied />;
  }

  const values = watch();

  function publishBlockerReason(values: ProjectEditorInput): string | null {
    if (!values.title?.trim() || values.title.trim().length < 3) return 'Add a title.';
    if (!values.clubId) return 'Choose a club.';
    if (!values.themeId) return 'Choose a theme.';
    if (!values.startDate) return 'Choose a start date.';
    if (!values.location?.trim() || values.location.trim().length < 3) return 'Add a location.';
    if (!values.description?.trim() || values.description.trim().length < 20) return 'Add a short description (at least 20 characters).';
    if (!values.coverImage) return 'Add a cover image (JPG/PNG).';

    const selectedClubName = clubsQuery.data?.find((club) => club.id === values.clubId)?.name ?? '';
    if (titleUsesRotaryWords(values.title) && selectedClubName && !clubNameIsIncluded(values.title, selectedClubName)) {
      return `If the title uses Rotary/Rotarian, include the club name: “${selectedClubName} …”`;
    }

    return null;
  }

  async function savePublished() {
    try {
      const publishValues = getValues() as ProjectEditorInput;
      const reason = publishBlockerReason(publishValues);
      if (reason) {
        setCurrentStep(0);
        setError('root', { message: reason });
        return;
      }

      await mutation.mutateAsync(publishValues);
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Unable to save project.' });
    }
  }

  async function handleNext() {
    const valid = await trigger(stepFields[currentStep]);
    if (valid) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    }
  }

  async function handleStepRequest(nextStep: number) {
    if (nextStep <= currentStep) {
      setCurrentStep(nextStep);
      return;
    }

    for (let index = 0; index < nextStep; index += 1) {
      const ok = await trigger(stepFields[index]);
      if (!ok) {
        setCurrentStep(index);
        return;
      }
    }

    setCurrentStep(nextStep);
  }

  return (
    <div className="page-stack editor-page">
      <PageHeader
        title={isEditing ? 'Edit project' : 'Create project'}
        description="Fill in the steps and save."
        actions={projectQuery.data ? <StatusBadge status={projectQuery.data.status} /> : undefined}
      />

      <Stepper currentStep={currentStep} steps={steps} onStepRequest={(step) => void handleStepRequest(step)} />

      <Card>
        {currentStep === 0 ? (
          <div className="form-stack">
            <Field label="Title" error={errors.title?.message}>
              <TextInput placeholder="School Library Refresh" {...register('title')} />
            </Field>
            <Field label="Description" hint="Explain the purpose, intended beneficiaries, and expected work." error={errors.description?.message}>
              <TextArea rows={6} placeholder="Describe the project clearly in plain language." {...register('description')} />
            </Field>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="form-stack">
            <InlineSearchSelectField
              label="Club"
              value={values.clubId}
              onChange={(value) => setValue('clubId', value, { shouldValidate: true })}
              placeholder="Search clubs (start typing...)"
              error={errors.clubId?.message}
              options={(clubsQuery.data ?? []).map((club) => ({ value: club.id, label: club.name }))}
            />
            <SelectField
              label="Theme"
              value={values.themeId}
              onChange={(value) => setValue('themeId', value, { shouldValidate: true })}
              placeholder="Choose theme"
              error={errors.themeId?.message}
              options={(themesQuery.data ?? []).map((theme) => ({ value: theme.id, label: theme.name }))}
            />
            <SelectField
              label="Project progress status"
              value={values.projectStatus}
              onChange={(value) => setValue('projectStatus', value as ProjectEditorInput['projectStatus'], { shouldValidate: true })}
              placeholder="Choose progress status"
              error={errors.projectStatus?.message}
              options={[
                { value: 'Planning', label: 'Planning' },
                { value: 'Active', label: 'Active' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Paused', label: 'Paused' },
              ]}
            />
            <Field label="Start date" error={errors.startDate?.message}>
              <TextInput type="date" {...register('startDate')} />
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <TextInput placeholder="Akim Oda, Eastern Region" {...register('location')} />
            </Field>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="form-stack">
            <UploadField
              label="Project cover image or flyer"
              hint="Use Brand Center-approved assets. Do not upload modified Rotary logos."
              value={values.coverImage ? [values.coverImage] : []}
              onChange={(next) => setValue('coverImage', next[0] ?? null)}
              accept="image/png,image/jpeg"
              maxFiles={1}
              kind="cover"
            />
            <UploadField
              label="Before and after photos"
              hint="JPG/PNG only."
              value={values.images ?? []}
              onChange={(next) => setValue('images', next)}
              accept="image/png,image/jpeg"
              maxFiles={8}
              kind="image"
            />
            <UploadField
              label="Proposal, budget, report, and supporting PDFs"
              hint="Proposal, budget, report, supporting documents (PDF only)."
              value={values.documents ?? []}
              onChange={(next) => setValue('documents', next)}
              accept="application/pdf"
              maxFiles={8}
              kind="pdf"
            />
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="review-grid">
            <Card className="review-card">
              <h2>Review summary</h2>
              <MetaList
                items={[
                  { label: 'Title', value: values.title || 'Not set yet' },
                  { label: 'Club', value: clubsQuery.data?.find((club) => club.id === values.clubId)?.name ?? 'Not selected' },
                  { label: 'Theme', value: themesQuery.data?.find((theme) => theme.id === values.themeId)?.name ?? 'Not selected' },
                  { label: 'Project status', value: formatStatusLabel(values.projectStatus) },
                  { label: 'Start date', value: formatDateLabel(values.startDate) },
                  { label: 'Location', value: values.location || 'Not set yet' },
                  { label: 'Cover image', value: values.coverImage?.name ?? 'No cover image added' },
                  { label: 'Extra images', value: String(values.images?.length ?? 0) },
                  { label: 'PDFs', value: String(values.documents?.length ?? 0) },
                ]}
              />
            </Card>
            <Card className="review-card">
              <h2>Description preview</h2>
              <p className="detail-body">{values.description || 'No description yet.'}</p>
            </Card>
          </div>
        ) : null}

        {errors.root?.message ? <p className="field-error">{errors.root.message}</p> : null}

        <div className="editor-footer">
          <div className="inline-actions">
            {currentStep > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}>
                Back
              </Button>
            ) : null}
            {currentStep < steps.length - 1 ? (
              <Button type="button" variant="secondary" onClick={() => void handleNext()}>
                Continue
              </Button>
            ) : null}
          </div>
          <div className="inline-actions">
            {currentStep === steps.length - 1 ? (
              <>
                {hasPermission('project.publish') ? (
                  <Button
                    type="button"
                    onClick={() => void savePublished()}
                    disabled={mutation.isPending || Boolean(publishBlockerReason(getValues() as ProjectEditorInput))}
                    title={publishBlockerReason(getValues() as ProjectEditorInput) ?? undefined}
                  >
                    {isEditing ? 'Save changes' : 'Publish'}
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <Button asChild variant="ghost">
        <Link to="/projects">Back to projects</Link>
      </Button>
    </div>
  );
}

function NavigateToAccessDenied() {
  window.location.replace('/access-denied');
  return null;
}

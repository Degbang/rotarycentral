import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { EventEditorInput, RecordStatus } from '@/data/model';
import { getEventById, listClubs, listThemes, saveEvent } from '@/data/api';
import { useAuth } from '@/features/auth';
import { clubNameIsIncluded, titleUsesRotaryWords } from '@/features/brandRules';
import { canEditEvent } from '@/features/permissions';
import { Button, Card, Field, MetaList, PageHeader, SearchSelectField, SelectField, StatusBadge, Stepper, TextArea, TextInput } from '@/ui/components';
import { UploadField } from '@/ui/upload-field';
import { formatDateTimeLabel } from '@/ui/formatters';

const eventSchema = z.object({
  title: z.string().min(3, 'Enter an event title.'),
  clubId: z.string().min(1, 'Choose a club.'),
  themeId: z.string().min(1, 'Choose a theme.'),
  date: z.string().min(1, 'Choose a date.'),
  time: z.string().optional(),
  isAllDay: z.boolean(),
  location: z.string().min(3, 'Enter a location.'),
  description: z.string().min(20, 'Add a short description with enough detail.'),
  flyer: z.any().nullable().optional(),
  images: z.array(z.any()),
  documents: z.array(z.any()),
  contactPerson: z.string().optional(),
});

const steps = [
  { title: 'Basic info', description: 'Title, summary, and contact.' },
  { title: 'Date and location', description: 'Club, theme, date, and place.' },
  { title: 'Media and attachments', description: 'Flyer, images, and PDFs.' },
  { title: 'Review and publish', description: 'Check everything before saving.' },
];

const stepFields: Array<Array<keyof EventEditorInput>> = [
  ['title', 'description', 'contactPerson'],
  ['clubId', 'themeId', 'date', 'location'],
  [],
  ['title', 'clubId', 'themeId', 'date', 'location', 'description', 'contactPerson'],
];

const emptyValues: EventEditorInput = {
  title: '',
  clubId: '',
  themeId: '',
  date: '',
  time: '',
  isAllDay: false,
  location: '',
  description: '',
  flyer: null,
  images: [],
  documents: [],
  contactPerson: '',
};

export function EventEditorPage() {
  const { eventId } = useParams();
  const isEditing = Boolean(eventId);
  const { session, hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const themesQuery = useQuery({ queryKey: ['themes'], queryFn: listThemes });
  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventById(session!, eventId!),
    enabled: Boolean(session && eventId),
  });

  type EventFormValues = z.infer<typeof eventSchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
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
    if (eventQuery.data) {
      reset({
        title: eventQuery.data.title,
        clubId: eventQuery.data.clubId,
        themeId: eventQuery.data.themeId,
        date: eventQuery.data.date,
        time: eventQuery.data.time ?? '',
        isAllDay: eventQuery.data.isAllDay,
        location: eventQuery.data.location,
        description: eventQuery.data.description,
        flyer: eventQuery.data.flyer ?? null,
        images: eventQuery.data.images,
        documents: eventQuery.data.documents,
        contactPerson: eventQuery.data.contactPerson,
      });
    }
  }, [eventQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: ({ values, status }: { values: EventEditorInput; status: RecordStatus }) => saveEvent(session!, values, status, eventId),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['event', record.id] });
      navigate(`/events/${record.id}`);
    },
  });

  if (!session) {
    return null;
  }

  const activeSession = session;

  if (eventQuery.data && !canEditEvent(activeSession, eventQuery.data)) {
    return <NavigateToAccessDenied />;
  }

  const values = watch();

  function publishBlockerReason(values: EventEditorInput): string | null {
    if (!values.title?.trim() || values.title.trim().length < 3) return 'Add a title.';
    if (!values.clubId) return 'Choose a club.';
    if (!values.themeId) return 'Choose a theme.';
    if (!values.date) return 'Choose a date.';
    if (!values.location?.trim() || values.location.trim().length < 3) return 'Add a location.';
    if (!values.description?.trim() || values.description.trim().length < 20) return 'Add a short description (at least 20 characters).';
    if (!values.flyer) return 'Add an event flyer (JPG/PNG).';

    const selectedClubName = clubsQuery.data?.find((club) => club.id === values.clubId)?.name ?? '';
    if (titleUsesRotaryWords(values.title) && selectedClubName && !clubNameIsIncluded(values.title, selectedClubName)) {
      return `If the title uses Rotary/Rotarian, include the club name: “${selectedClubName} …”`;
    }

    return null;
  }

  function buildDraftPayload(): EventEditorInput {
    const raw = getValues();
    return {
      ...raw,
      title: raw.title || 'Untitled event draft',
      clubId: raw.clubId || activeSession.clubIds[0] || clubsQuery.data?.[0]?.id || '',
      themeId: raw.themeId || themesQuery.data?.[0]?.id || '',
      date: raw.date || new Date().toISOString().slice(0, 10),
      location: raw.location || 'Location to be confirmed',
      description: raw.description || 'Draft description to be updated before review.',
      contactPerson: raw.contactPerson || activeSession.user.displayName,
      images: raw.images ?? [],
      documents: raw.documents ?? [],
      flyer: raw.flyer ?? null,
      isAllDay: Boolean(raw.isAllDay),
      time: raw.time,
    };
  }

  async function saveAs(status: RecordStatus) {
    try {
      if (status === 'DRAFT') {
        await mutation.mutateAsync({ values: buildDraftPayload(), status });
        return;
      }

      const publishValues = {
        ...getValues(),
        contactPerson: (getValues().contactPerson || activeSession.user.displayName).trim(),
      };

      const reason = publishBlockerReason(publishValues);
      if (reason) {
        setCurrentStep(0);
        setError('root', { message: reason });
        return;
      }

      if (status === 'PUBLISHED') {
        // Brand naming rules + required fields are enforced above for a hard publish block.
      }

      await mutation.mutateAsync({ values: publishValues, status });
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Unable to save event.' });
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
        title={isEditing ? 'Edit event' : 'Create event'}
        description="Fill in the steps and save."
        actions={eventQuery.data ? <StatusBadge status={eventQuery.data.status} /> : undefined}
      />

      <Stepper currentStep={currentStep} steps={steps} onStepRequest={(step) => void handleStepRequest(step)} />

      <Card>
        {currentStep === 0 ? (
          <div className="form-stack">
            <Field label="Title" error={errors.title?.message}>
              <TextInput placeholder="District Membership and Public Image Forum" {...register('title')} />
            </Field>
            <Field label="Description" hint="Use plain language and keep it easy to scan." error={errors.description?.message}>
              <TextArea rows={6} placeholder="What will happen, who it is for, and what participants need to know." {...register('description')} />
            </Field>
            <Field label="Contact person" error={errors.contactPerson?.message}>
              <TextInput placeholder="District Membership Chair" {...register('contactPerson')} />
            </Field>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="form-stack">
            <SearchSelectField
              label="Club"
              value={values.clubId}
              onChange={(value) => setValue('clubId', value, { shouldValidate: true })}
              placeholder="Choose club"
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
            <Field label="Date" error={errors.date?.message}>
              <TextInput type="date" {...register('date')} />
            </Field>
            <label className="checkbox-row">
              <input type="checkbox" {...register('isAllDay')} />
              This is an all-day event
            </label>
            {!values.isAllDay ? (
              <Field label="Time">
                <TextInput type="time" {...register('time')} />
              </Field>
            ) : null}
            <Field label="Location" error={errors.location?.message}>
              <TextInput placeholder="Airport View Hotel, Accra" {...register('location')} />
            </Field>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="form-stack">
            <UploadField
              label="Event flyer"
              hint="Use Brand Center-approved assets. Do not upload modified Rotary logos."
              value={values.flyer ? [values.flyer] : []}
              onChange={(next) => setValue('flyer', next[0] ?? null)}
              accept="image/png,image/jpeg"
              maxFiles={1}
              kind="flyer"
            />
            <UploadField
              label="Additional event images"
              hint="JPG/PNG only."
              value={values.images ?? []}
              onChange={(next) => setValue('images', next)}
              accept="image/png,image/jpeg"
              maxFiles={6}
              kind="image"
            />
            <UploadField
              label="PDF attachments"
              hint="Invitation, agenda, programme, brochure (PDF only)."
              value={values.documents ?? []}
              onChange={(next) => setValue('documents', next)}
              accept="application/pdf"
              maxFiles={6}
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
                  { label: 'Date and time', value: formatDateTimeLabel(values.date, values.time, values.isAllDay) },
                  { label: 'Location', value: values.location || 'Not set yet' },
                  { label: 'Contact person', value: values.contactPerson || 'Not set yet' },
                  { label: 'Flyer', value: values.flyer?.name ?? 'No flyer added' },
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
            <Button type="button" variant="ghost" onClick={() => void saveAs('DRAFT')} disabled={isSubmitting || mutation.isPending}>
              Save draft
            </Button>
            {currentStep === steps.length - 1 ? (
              <>
                {hasPermission('event.publish') ? (
                  <Button
                    type="button"
                    onClick={() => void saveAs('PUBLISHED')}
                    disabled={mutation.isPending || Boolean(publishBlockerReason(getValues() as EventEditorInput))}
                    title={publishBlockerReason(getValues() as EventEditorInput) ?? undefined}
                  >
                    Publish
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <Button asChild variant="ghost">
        <Link to="/events">Back to events</Link>
      </Button>
    </div>
  );
}

function NavigateToAccessDenied() {
  window.location.replace('/access-denied');
  return null;
}

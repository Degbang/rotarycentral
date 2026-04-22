import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { AnnouncementEditorInput } from '@/data/model';
import { getAnnouncementById, listClubs, saveAnnouncement } from '@/data/api';
import { useAuth } from '@/features/auth';
import { Button, Card, Field, InlineSearchSelectField, PageHeader, SelectField, TextArea, TextInput } from '@/ui/components';

const schema = z.object({
  title: z.string().min(3, 'Enter a title.'),
  scope: z.enum(['DISTRICT', 'CLUB']),
  clubId: z.string().optional(),
  body: z.string().min(10, 'Write a short announcement message.'),
});

type FormValues = z.infer<typeof schema>;

export function AnnouncementEditorPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { announcementId } = useParams<{ announcementId: string }>();
  const isEditing = Boolean(announcementId);

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: listClubs });
  const announcementQuery = useQuery({
    queryKey: ['announcement', announcementId],
    queryFn: () => getAnnouncementById(session!, announcementId!),
    enabled: Boolean(session && announcementId),
  });

  const {
    register,
    setValue,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', scope: 'DISTRICT', clubId: '', body: '' },
  });

  const values = watch();

  useEffect(() => {
    if (!isEditing) return;
    if (!announcementQuery.data) return;
    reset({
      title: announcementQuery.data.title,
      scope: announcementQuery.data.scope,
      clubId: announcementQuery.data.clubId ?? '',
      body: announcementQuery.data.body,
    });
  }, [announcementQuery.data, isEditing, reset]);

  const mutation = useMutation({
    mutationFn: (input: AnnouncementEditorInput) => saveAnnouncement(session!, input, announcementId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      navigate('/announcements');
    },
  });

  if (!session) return null;

  const clubOptions = (clubsQuery.data ?? []).map((club) => ({ value: club.id, label: club.name }));

  return (
    <div className="page-stack editor-page">
      <PageHeader
        title={isEditing ? 'Edit announcement' : 'Post announcement'}
        description="District or club updates visible to all logged-in users."
      />

      <Card>
        <form
          className="form-stack"
          aria-busy={isSubmitting}
          onSubmit={handleSubmit(async (data) => {
            try {
              if (data.scope === 'CLUB' && !data.clubId) {
                setError('clubId', { message: 'Choose a club.' });
                return;
              }

              await mutation.mutateAsync({
                title: data.title,
                body: data.body,
                scope: data.scope,
                clubId: data.scope === 'CLUB' ? data.clubId : null,
              });
            } catch (error) {
              setError('root', { message: error instanceof Error ? error.message : 'Unable to save announcement.' });
            }
          })}
        >
          <Field label="Title" error={errors.title?.message}>
            <TextInput placeholder="Announcement title" {...register('title')} />
          </Field>

          <SelectField
            label="Level"
            value={values.scope}
            onChange={(value) => setValue('scope', value as FormValues['scope'], { shouldValidate: true })}
            placeholder="Choose level"
            error={errors.scope?.message}
            options={[
              { value: 'DISTRICT', label: 'District announcement' },
              { value: 'CLUB', label: 'Club announcement' },
            ]}
          />

          {values.scope === 'CLUB' ? (
            <InlineSearchSelectField
              label="Club"
              value={values.clubId || ''}
              onChange={(value) => setValue('clubId', value, { shouldValidate: true })}
              placeholder="Search clubs (start typing...)"
              error={errors.clubId?.message}
              options={clubOptions}
            />
          ) : null}

          <Field label="Message" hint="Keep it clear and short." error={errors.body?.message}>
            <TextArea placeholder="Write your announcement..." rows={7} {...register('body')} />
          </Field>

          {errors.root?.message ? <p className="field-error">{errors.root.message}</p> : null}

          <div className="inline-actions">
            <Button type="button" variant="ghost" onClick={() => navigate('/announcements')} disabled={isSubmitting || mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isEditing ? 'Save changes' : 'Publish announcement'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


import { useState } from 'react';
import {
  Modal,
  Button,
  FileButton,
  Text,
  Stack,
  Group,
  Alert,
  Code,
  ScrollArea,
  Anchor,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
  importResponsibilities,
  downloadImportTemplate,
  IMPORT_COLUMNS,
  type ImportSummary,
} from '../../services/import.service';
import { isPlanLimitError } from '../../services/api';

/**
 * Settings row + modal for Step K — import responsibilities from a tracker CSV.
 * The mutation surfaces PLAN_LIMIT_REACHED through the global limit modal
 * (MutationCache), so we only toast other failures here.
 */
export default function ImportTrackerRow() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (f: File) => importResponsibilities(f),
    onSuccess: (res) => {
      setSummary(res);
      if (res.created > 0) {
        notifications.show({
          title: 'Import complete',
          message: `Added ${res.created} ${res.created === 1 ? 'responsibility' : 'responsibilities'}.`,
          color: 'teal',
        });
        // Refresh every list that could show the new rows.
        void queryClient.invalidateQueries();
      } else {
        notifications.show({
          title: 'Nothing imported',
          message: 'No valid rows were found — check the column names and dates.',
          color: 'yellow',
        });
      }
    },
    onError: (err) => {
      // Plan-limit 403s are handled globally by the upgrade modal.
      if (isPlanLimitError(err)) return;
      notifications.show({
        title: 'Import failed',
        message: err instanceof Error ? err.message : 'Try again in a minute.',
        color: 'red',
      });
    },
  });

  const close = () => {
    setOpen(false);
    setFile(null);
    setSummary(null);
    mutation.reset();
  };

  return (
    <>
      <div className="settings-row">
        <div>
          <div className="label">Import from a tracker</div>
          <div className="help">
            Bring rows from a tracker spreadsheet into PLOS. Export your sheet to CSV
            first, then map the columns to the template.
          </div>
        </div>
        <button
          type="button"
          className="input"
          style={{ width: 'auto', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setOpen(true)}
        >
          Import CSV
        </button>
      </div>

      <Modal opened={open} onClose={close} title="Import responsibilities from CSV" centered radius="md" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Your CSV needs a header row. Supported columns (case-insensitive):
          </Text>
          <Code block>{IMPORT_COLUMNS.join(', ')}</Code>
          <Text size="xs" c="dimmed">
            <b>title</b> and <b>dueDate</b> are required per row. Dates accept{' '}
            <Code>YYYY-MM-DD</Code> or <Code>DD/MM/YYYY</Code>. Unknown categories fall
            back to <Code>admin</Code>.{' '}
            <Anchor component="button" type="button" onClick={downloadImportTemplate}>
              Download template
            </Anchor>
          </Text>

          {summary ? (
            <ImportResult summary={summary} />
          ) : (
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <FileButton onChange={setFile} accept=".csv,text/csv">
                  {(props) => (
                    <Button {...props} variant="default">
                      {file ? 'Choose a different file' : 'Choose CSV file'}
                    </Button>
                  )}
                </FileButton>
                {file && (
                  <Text size="sm" c="dimmed" lineClamp={1} style={{ maxWidth: 220 }}>
                    {file.name}
                  </Text>
                )}
              </Group>
              <Button
                color="violet"
                disabled={!file}
                loading={mutation.isPending}
                onClick={() => file && mutation.mutate(file)}
              >
                Import
              </Button>
            </Group>
          )}

          {summary && (
            <Group justify="flex-end">
              <Button variant="default" onClick={close}>
                Done
              </Button>
            </Group>
          )}
        </Stack>
      </Modal>
    </>
  );
}

function ImportResult({ summary }: { summary: ImportSummary }) {
  return (
    <Stack gap="sm">
      <Alert color={summary.created > 0 ? 'teal' : 'yellow'} radius="md">
        Imported <b>{summary.created}</b> of {summary.total} rows
        {summary.skipped > 0 ? ` · skipped ${summary.skipped}` : ''}.
      </Alert>
      {summary.errors.length > 0 && (
        <>
          <Text size="sm" fw={600}>
            Skipped rows
          </Text>
          <ScrollArea.Autosize mah={180}>
            <Stack gap={4}>
              {summary.errors.map((e) => (
                <Text key={e.row} size="xs" c="dimmed">
                  Row {e.row}: {e.reason}
                </Text>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </>
      )}
    </Stack>
  );
}

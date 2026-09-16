import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import JsonYaml from './JsonYaml';
import { usePrefs } from '../../store/prefs.store';
import { useUsage } from '../../store/usage.store';

test('a successful conversion with telemetry on tracks one usage for dev-json-yaml', async () => {
  usePrefs.setState({ telemetry: true });
  useUsage.setState({ counts: {} });
  render(
    <MemoryRouter>
      <JsonYaml />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByLabelText('Input', { selector: 'textarea' }), '{{"a":1}');
  await screen.findByDisplayValue(/a: 1/);
  expect(useUsage.getState().counts['dev-json-yaml']).toBe(1);
  usePrefs.setState({ telemetry: false });
});

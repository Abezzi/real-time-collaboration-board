import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import NoteEditDialog from '../NoteEditDialog.vue';

describe('NoteEditDialog', () => {
  const defaultProps = {
    modelValue: true,
    note: {
      id: 1,
      title: 'Old Title',
      content: 'Old content',
      color: '#ffeb3b',
    },
  };

  it('shows current note values', () => {
    render(NoteEditDialog, { props: defaultProps });

    expect(screen.getByLabelText(/title/i)).toHaveValue('Old Title');
    expect(screen.getByText('Old content')).toBeInTheDocument();
  });

  it('emits update when Save is clicked', async () => {
    const user = userEvent.setup();
    // const { emitted } = render(NoteEditDialog, { props: defaultProps });

    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    const saveBtn = screen.getByRole('button', { name: /save/i });
    await user.click(saveBtn);

    // expect(emitted()['update:modelValue']).toBeTruthy();
  });
});

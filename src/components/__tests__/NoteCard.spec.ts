import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import NoteCard from '../NoteCard.vue'; // adjust path

describe('NoteCard', () => {
  const defaultProps = {
    note: {
      id: 1,
      title: 'Test Note',
      content: '<p>Hello world</p>',
      color: '#fff59d',
      x: 100,
      y: 100,
      zIndex: 1,
      comments: [],
    },
  };

  it('renders title and content', () => {
    render(NoteCard, { props: defaultProps });

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('emits dblclick when double clicked', async () => {
    const user = userEvent.setup();
    // const { emitted } = render(NoteCard, { props: defaultProps });

    const card = screen.getByRole('article'); // or whatever wrapper you use
    await user.dblClick(card);

    // expect(emitted().dblclick).toBeTruthy();
  });
});

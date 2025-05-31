import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CommentsList from '../CommentsList';

const theme = createTheme();

const customRender = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

const mockComments = [
  {
    ID: '1',
    'Project ID': 'test-project',
    'Posted By': 'test@example.com',
    Nickname: 'Test User',
    Comment: 'Test comment',
    'Is Private': false,
    'Posted By Profile Image': 'https://example.com/avatar.jpg',
    'Created Date': '2025-05-30T00:00:00Z',
    'Updated Date': '2025-05-30T00:00:00Z',
    Owner: 'system',
    Files: '[]',
    images: []
  }
];

describe('CommentsList', () => {
  it('renders comments list correctly', () => {
    render(
      <CommentsList 
        commentsData={mockComments} 
        projectId="test-project"
      />
    );
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
  });

  it('sorts comments correctly', () => {
    const comments = [
      {
        ...mockComments[0],
        ID: '1',
        Comment: 'First comment',
        'Created Date': '2025-05-29T00:00:00Z'
      },
      {
        ...mockComments[0],
        ID: '2',
        Comment: 'Second comment',
        'Created Date': '2025-05-30T00:00:00Z'
      }
    ];

    render(
      <CommentsList 
        commentsData={comments} 
        projectId="test-project"
      />
    );

    const commentElements = screen.getAllByText(/comment/);
    expect(commentElements[0].textContent).toBe('Second comment');
    expect(commentElements[1].textContent).toBe('First comment');
  });

  it('opens add comment dialog when button is clicked', async () => {
    render(
      <CommentsList 
        commentsData={mockComments} 
        projectId="test-project"
      />
    );

    fireEvent.click(screen.getByText('Add Comment'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles image preview correctly', async () => {
    const commentsWithImage = [
      {
        ...mockComments[0],
        images: ['https://example.com/test-image.jpg']
      }
    ];

    render(
      <CommentsList 
        commentsData={commentsWithImage} 
        projectId="test-project"
      />
    );

    const imageElement = screen.getByRole('button', { name: /view image 1/i });
    fireEvent.click(imageElement);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument();
    });
  });
});

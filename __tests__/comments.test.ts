import { projectItemsService } from '../utils/projectItemsService';
import { appendToCSV } from '../utils/csvUtils';
import { readCsvWithFilter } from '../utils/csvParser';
import path from 'path';
import fs from 'fs';
import { ProjectComment } from '../types/projectItems';

// Mock CSV utilities
jest.mock('../utils/csvUtils', () => ({
  appendToCSV: jest.fn()
}));

jest.mock('../utils/csvParser', () => ({
  readCsvWithFilter: jest.fn()
}));

describe('Comment Service', () => {
  const testComment: Partial<ProjectComment> = {
    'Project ID': 'test-project-123',
    'Posted By': 'test@example.com',
    'Nickname': 'Test User',
    'Comment': 'This is a test comment',
    'Is Private': false
  };

  beforeEach(() => {
    // Clear mock data before each test
    jest.clearAllMocks();
    (appendToCSV as jest.Mock).mockResolvedValue(true);
  });

  describe('addComment', () => {
    it('should create a comment with required fields in correct order', async () => {
      await projectItemsService.addComment(testComment);

      expect(appendToCSV).toHaveBeenCalledTimes(1);
      const [filePath, commentData] = (appendToCSV as jest.Mock).mock.calls[0];

      expect(filePath).toContain('ProjectComments.csv');
      expect(commentData).toHaveProperty('ID');
      expect(commentData).toHaveProperty('Created Date');
      expect(commentData).toHaveProperty('Updated Date');

      // Verify column ordering
      const columnOrder = [
        "Posted By",
        "Nickname",
        "Project ID",
        "Files",
        "Comment",
        "Is Private",
        "Posted By Profile Image",
        "Add To Gallery",
        "ID",
        "Created Date",
        "Updated Date",
        "Owner"
      ];
      
      const commentKeys = Object.keys(commentData);
      expect(commentKeys).toEqual(columnOrder);
    });

    it('should handle missing optional fields', async () => {
      const minimalComment: Partial<ProjectComment> = {
        'Project ID': 'test-project-123',
        'Posted By': 'test@example.com',
        'Nickname': 'Test User',
        'Comment': 'Test comment'
      };

      await projectItemsService.addComment(minimalComment);

      expect(appendToCSV).toHaveBeenCalledTimes(1);
      const commentData = (appendToCSV as jest.Mock).mock.calls[0][1];
      
      expect(commentData.Files).toBe('');
      expect(commentData['Is Private']).toBe(false);
      expect(commentData['Posted By Profile Image']).toBeUndefined();
      expect(commentData['Add To Gallery']).toBeUndefined();
    });

    it('should return null if CSV append fails', async () => {
      (appendToCSV as jest.Mock).mockResolvedValue(false);

      const result = await projectItemsService.addComment(testComment);
      expect(result).toBeNull();
    });

    it('should process and validate image URLs correctly', async () => {
      const commentWithImages: Partial<ProjectComment> = {
        ...testComment,
        'Files': 'https://example.com/image1.jpg, https://example.com/image2.png',
        'Posted By Profile Image': 'https://example.com/profile.jpg'
      };

      await projectItemsService.addComment(commentWithImages);

      const [, commentData] = (appendToCSV as jest.Mock).mock.calls[0];
      expect(commentData.Files).toBe('https://example.com/image1.jpg, https://example.com/image2.png');
      expect(commentData['Posted By Profile Image']).toBe('https://example.com/profile.jpg');
    });

    it('should handle invalid image URLs', async () => {
      const commentWithInvalidImages: Partial<ProjectComment> = {
        ...testComment,
        'Files': 'invalid-url, https://example.com/valid.jpg',
        'Posted By Profile Image': 'not-a-url'
      };

      await projectItemsService.addComment(commentWithInvalidImages);

      const [, commentData] = (appendToCSV as jest.Mock).mock.calls[0];
      expect(commentData.Files).toBe('https://example.com/valid.jpg');
      expect(commentData['Posted By Profile Image']).toBe('');
    });

    it('should reject comments with missing required fields', async () => {
      const invalidComment: Partial<ProjectComment> = {
        'Comment': 'Missing required fields'
      };

      await expect(projectItemsService.addComment(invalidComment))
        .rejects.toThrow('Missing required fields');
      
      expect(appendToCSV).not.toHaveBeenCalled();
    });

    it('should sanitize comment content', async () => {
      const commentWithHTML: Partial<ProjectComment> = {
        ...testComment,
        'Comment': '<script>alert("xss")</script>Test comment with <b>HTML</b>'
      };

      await projectItemsService.addComment(commentWithHTML);

      const [, commentData] = (appendToCSV as jest.Mock).mock.calls[0];
      expect(commentData.Comment).toBe('Test comment with HTML');
    });
  });

  describe('getProjectComments', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('should sort comments by creation date in descending order', async () => {
      // Setup mock data
      const mockComments = [
        {
          'ID': '1',
          'Project ID': 'test-project-123',
          'Posted By': 'user1@example.com',
          'Nickname': 'User 1',
          'Comment': 'First comment',
          'Created Date': '2024-01-01T00:00:00Z',
          'Updated Date': '2024-01-01T00:00:00Z',
          'Files': '',
          'Is Private': 'false',
          'Owner': ''
        },
        {
          'ID': '2',
          'Project ID': 'test-project-123',
          'Posted By': 'user2@example.com',
          'Nickname': 'User 2',
          'Comment': 'Second comment',
          'Created Date': '2024-02-01T00:00:00Z',
          'Updated Date': '2024-02-01T00:00:00Z',
          'Files': '',
          'Is Private': 'false',
          'Owner': ''
        }
      ];
      
      // Mock the CSV parser
      (readCsvWithFilter as jest.Mock).mockImplementation(() => Promise.resolve(mockComments));

      const result = await projectItemsService.getProjectComments('test-project-123');
      expect(result[0]['Created Date']).toBe('2024-02-01T00:00:00Z');
      expect(result[1]['Created Date']).toBe('2024-01-01T00:00:00Z');
    });

    it('should properly process image URLs in comments', async () => {
      // TODO: Add test for image URL processing once image handling is implemented
    });

    it('should filter out invalid comments', async () => {
      // TODO: Add test for invalid comment filtering
    });
  });
});

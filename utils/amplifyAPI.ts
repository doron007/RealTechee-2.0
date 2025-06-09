import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';

// Configure Amplify with your sandbox outputs
Amplify.configure(outputs);

// Generate a typed client for your schema
const client = generateClient<Schema>();

// Property API functions
export const propertyAPI = {
  // Create a new property
  async create(propertyData: {
    propertyFullAddress?: string;
    houseAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    floors?: number;
    sizeSqft?: number;
    yearBuilt?: number;
  }) {
    try {
      const result = await (client.models as any).Property.create(propertyData);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating property:', error);
      return { success: false, error };
    }
  },

  // List all properties
  async list() {
    try {
      const result = await (client.models as any).Property.list({});
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error listing properties:', error);
      return { success: false, error };
    }
  },

  // Get property by ID
  async get(id: string) {
    try {
      const result = await (client.models as any).Property.get({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting property:', error);
      return { success: false, error };
    }
  },

  // Update property
  async update(id: string, updates: any) {
    try {
      const result = await (client.models as any).Property.update({ id, ...updates });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating property:', error);
      return { success: false, error };
    }
  },

  // Delete property
  async delete(id: string) {
    try {
      const result = await (client.models as any).Property.delete({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error deleting property:', error);
      return { success: false, error };
    }
  }
};

// Contact API functions
export const contactAPI = {
  async create(contactData: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    company?: string;
    brokerage?: string;
  }) {
    try {
      const result = await (client.models as any).Contact.create(contactData);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating contact:', error);
      return { success: false, error };
    }
  },

  async list() {
    try {
      const result = await (client.models as any).Contact.list({});
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error listing contacts:', error);
      return { success: false, error };
    }
  },

  async get(id: string) {
    try {
      const result = await (client.models as any).Contact.get({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting contact:', error);
      return { success: false, error };
    }
  },

  async update(id: string, updates: any) {
    try {
      const result = await (client.models as any).Contact.update({ id, ...updates });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { success: false, error };
    }
  },

  async delete(id: string) {
    try {
      const result = await (client.models as any).Contact.delete({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error };
    }
  }
};

// Project API functions
export const projectAPI = {
  async create(projectData: {
    projectID?: string;
    title?: string;
    status?: string;
    propertyType?: string;
    description?: string;
    bathrooms?: number;
    floors?: number;
    sizeSqft?: number;
    yearBuilt?: number;
  }) {
    try {
      const result = await (client.models as any).Project.create(projectData);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error };
    }
  },

  async list() {
    try {
      const result = await (client.models as any).Project.list({});
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error listing projects:', error);
      return { success: false, error };
    }
  },

  async get(id: string) {
    try {
      const result = await (client.models as any).Project.get({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting project:', error);
      return { success: false, error };
    }
  },

  async update(id: string, updates: any) {
    try {
      const result = await (client.models as any).Project.update({ id, ...updates });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error };
    }
  },

  async delete(id: string) {
    try {
      const result = await (client.models as any).Project.delete({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error };
    }
  }
};

// Export the raw client for advanced usage
export { client };
export type { Schema };

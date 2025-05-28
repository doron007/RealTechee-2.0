/**
 * Utilities for generating dynamic project and property descriptions
 */

import { Project } from '../types/projects';

/**
 * Generate a natural-sounding property description based on project details
 */
export function generatePropertyDescription(project: Project): string {
  // Gather all the available property details
  const propertyType = project["Property Type"] || "property";
  const bedrooms = project.Bedrooms || '0';
  const bathrooms = project.Bathrooms || '0';
  const squareFeet = project["Size Sqft."] || '0';
  const yearBuilt = project["Year Built"] || '';
  const floors = project.Floors || '1';

  // Base description parts
  const parts: string[] = [];

  // Start with property type and size
  if (squareFeet !== '0') {
    parts.push(`This ${propertyType.toLowerCase()} offers ${squareFeet} square feet of living space`);
  } else {
    parts.push(`This ${propertyType.toLowerCase()}`);
  }

  // Add bedroom and bathroom count
  if (bedrooms !== '0' || bathrooms !== '0') {
    const bedroomPhrase = bedrooms !== '0' ? `${bedrooms} bedrooms` : '';
    const bathroomPhrase = bathrooms !== '0' ? `${bathrooms} bathrooms` : '';
    if (bedroomPhrase && bathroomPhrase) {
      parts.push(`features ${bedroomPhrase} and ${bathroomPhrase}`);
    } else if (bedroomPhrase) {
      parts.push(`features ${bedroomPhrase}`);
    } else if (bathroomPhrase) {
      parts.push(`features ${bathroomPhrase}`);
    }
  }

  // Add floor information
  if (floors !== '1' && floors !== '0') {
    parts.push(`spread across ${floors} floors`);
  }

  // Add year built if available
  if (yearBuilt) {
    parts.push(`built in ${yearBuilt}`);
  }

  // Add renovation status if available
  if (project.Status) {
    parts.push(`with ${project.Status.toLowerCase()} renovations`);
  }

  // Handle project-specific details
  if (project["Boost Price"] || project["Booster Estimated Cost"]) {
    parts.push("scheduled for strategic improvements to maximize property value");
  }

  if (project["Added value"] && parseFloat(project["Added value"]) > 0) {
    parts.push("with significant value-adding renovations");
  }

  // Combine all parts with proper punctuation
  return parts.join(', ') + '.';
}

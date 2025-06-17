/**
 * Utilities for generating dynamic project and property descriptions
 */

import { Project } from '../types/projects';

/**
 * Generate a natural-sounding property description based on project details
 */
export function generatePropertyDescription(project: Project): string {
  // Gather all the available property details
  const propertyType = project.propertyType || "property";
  const bedrooms = project.bedrooms?.toString() || '0';
  const bathrooms = project.bathrooms?.toString() || '0';
  const squareFeet = project.sizeSqft?.toString() || '0';
  const yearBuilt = project.yearBuilt?.toString() || '';
  const floors = project.floors?.toString() || '1';

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
  if (project.status) {
    parts.push(`with ${project.status.toLowerCase()} renovations`);
  }

  // Handle project-specific details
  if (project.boostPrice || project.boosterEstimatedCost) {
    parts.push("scheduled for strategic improvements to maximize property value");
  }

  if (project.addedValue && parseFloat(project.addedValue.toString()) > 0) {
    parts.push("with significant value-adding renovations");
  }

  // Combine all parts with proper punctuation
  return parts.join(', ') + '.';
}

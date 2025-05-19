# Component-Oriented Output (COO) Guidelines for GitHub Copilot

When providing code solutions in this project, please follow these principles:

1. **Prefer extending component interfaces over creating wrapper components**
   - Add properties directly to existing components rather than creating HOCs or wrapper elements
   - Look for opportunities to extend component interfaces first

2. **Minimize DOM nesting and avoid unnecessary wrapper elements**
   - Avoid creating additional HTML elements simply for styling or layout purposes
   - Use React.Fragment or component composition instead of wrapper divs

3. **Components should handle their styling internally**
   - Follow strict Component-Oriented Output design principles
   - Styling logic should be encapsulated within components
   - Props should control styling behavior, not require client-side CSS

4. **Extend component props before resorting to wrappers or className hacks**
   - If a component needs new capabilities, extend its props interface
   - Avoid inline styles directly in JSX when possible - add style props to the component
   - Avoid className manipulation for styling that could be controlled by props

5. **Keep client code clean by implementing styling logic within components**
   - Client code should focus on what a component does, not how it's styled
   - Component APIs should be intuitive and not leak implementation details
   - Use sensible defaults with override capabilities

6. **Prefer direct solutions over complex workarounds**
   - Look for the simplest and most direct solution first
   - Avoid complex patterns when a simple property addition would suffice
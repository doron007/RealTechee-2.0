import React from 'react';
import EstimateButton from '../common/buttons/EstimateButton';
import P2 from '../typography/P2' 
import { EstimateMode, EstimatePriority, EstimateStatus } from '../common/buttons/EstimateButton';

const priorityOptions: EstimatePriority[] = ['primary', 'secondary', 'tertiary'];
const statusOptions: EstimateStatus[] = ['normal', 'hover', 'pressed', 'disabled'];

/**
 * Component to showcase the GetAnEstimate button with various configurations
 * following the Figma design exactly
 */
const GetAnEstimateShowcase = () => {
  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold mb-6">Get an Estimate Button</h2>
      <p className="text-lg mb-8">
        Specialized button component for the &quot;Get an Estimate&quot; call-to-action
        throughout the site. Configurable by priority, status, and mode.
      </p>

      {/* Light Mode Table */}
      <div className="mb-16">
        <h3 className="text-2xl font-semibold mb-6">Light Mode</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 bg-gray-50 min-w-[180px]">Priority / Status</th>
                {statusOptions.map(status => (
                  <th key={`header-${status}`} className="border border-gray-300 px-4 py-2 bg-gray-50 text-center capitalize min-w-[220px]">
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priorityOptions.map(priority => (
                <tr key={`row-${priority}`}>
                  <td className="border border-gray-300 px-4 py-4 bg-gray-50 font-medium capitalize">
                    {priority}
                    <div className="text-xs text-gray-500 mt-1 normal-case">
                      {priority === 'primary' && 'Main call to action'}
                      {priority === 'secondary' && 'Supporting action'}
                      {priority === 'tertiary' && 'Text-only action'}
                    </div>
                  </td>
                  
                  {statusOptions.map(status => (
                    <td key={`${priority}-${status}`} className="border border-gray-300 p-6 text-center">
                      <div className="flex justify-center">
                        <EstimateButton 
                          priority={priority}
                          forceStatus={status}
                          mode="light"
                          disabled={status === 'disabled'}
                        />
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {priority === 'primary' && (
                          <>
                            {status === 'normal' && 'bg-[#2A2B2E], text-white'}
                            {status === 'hover' && 'bg-black, text-white'}
                            {status === 'pressed' && 'bg-[#4E4E52], text-white'}
                            {status === 'disabled' && 'bg-[#BCBCBF], text-white'}
                          </>
                        )}
                        {priority === 'secondary' && (
                          <>
                            {status === 'normal' && 'bg-white, text-[#2A2B2E], border-[#2A2B2E]'}
                            {status === 'hover' && 'bg-[#BCBCBF], text-[#2A2B2E], border-[#2A2B2E]'}
                            {status === 'pressed' && 'bg-[#2A2B2E], text-white, border-[#2A2B2E]'}
                            {status === 'disabled' && 'bg-white, text-[#BCBCBF], border-[#BCBCBF]'}
                          </>
                        )}
                        {priority === 'tertiary' && (
                          <>
                            {status === 'normal' && 'text-[#2A2B2E], transparent'}
                            {status === 'hover' && 'text-black, transparent'}
                            {status === 'pressed' && 'text-[#4E4E52], transparent'}
                            {status === 'disabled' && 'text-[#BCBCBF], transparent'}
                          </>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Dark Mode Table */}
      <div className="mb-16 p-8 rounded-lg bg-[#2A2B2E]">
        <h3 className="text-2xl font-semibold mb-6 text-white">Dark Mode</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-600 px-4 py-2 bg-gray-800 text-white min-w-[180px]">Priority / Status</th>
                {statusOptions.map(status => (
                  <th key={`header-${status}-dark`} className="border border-gray-600 px-4 py-2 bg-gray-800 text-white text-center capitalize min-w-[220px]">
                    {status}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priorityOptions.map(priority => (
                <tr key={`row-${priority}-dark`}>
                  <td className="border border-gray-600 px-4 py-4 bg-gray-800 text-white font-medium capitalize">
                    {priority}
                    <div className="text-xs text-gray-300 mt-1 normal-case">
                      {priority === 'primary' && 'Main call to action'}
                      {priority === 'secondary' && 'Supporting action'}
                      {priority === 'tertiary' && 'Text-only action'}
                    </div>
                  </td>
                  
                  {statusOptions.map(status => (
                    <td key={`${priority}-${status}-dark`} className="border border-gray-600 p-6 text-center">
                      <div className="flex justify-center">
                        <EstimateButton 
                          priority={priority}
                          forceStatus={status}
                          mode="dark"
                          disabled={status === 'disabled'}
                        />
                      </div>
                      <div className="mt-3 text-xs text-gray-300">
                        {priority === 'primary' && (
                          <>
                            {status === 'normal' && 'bg-white, text-[#2A2B2E]'}
                            {status === 'hover' && 'bg-[#D2D2D4], text-[#2A2B2E]'}
                            {status === 'pressed' && 'bg-[#6E6E73], text-white'}
                            {status === 'disabled' && 'bg-[#3D3D3F], text-[#8B8B8F]'}
                          </>
                        )}
                        {priority === 'secondary' && (
                          <>
                            {status === 'normal' && 'transparent, text-white, border-white'}
                            {status === 'hover' && 'bg-white/10, text-white, border-white'}
                            {status === 'pressed' && 'bg-white/20, text-white, border-white'}
                            {status === 'disabled' && 'transparent, text-[#8B8B8F], border-[#8B8B8F]'}
                          </>
                        )}
                        {priority === 'tertiary' && (
                          <>
                            {status === 'normal' && 'transparent, text-white'}
                            {status === 'hover' && 'transparent, text-[#D2D2D4]'}
                            {status === 'pressed' && 'transparent, text-[#6E6E73]'}
                            {status === 'disabled' && 'transparent, text-[#8B8B8F]'}
                          </>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Special Scenarios */}
      <div className="mb-16">
        <h3 className="text-2xl font-semibold mb-6">Component Variations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h4 className="font-medium text-lg mb-4">Custom Text</h4>
            <div className="flex justify-center mb-6">
              <EstimateButton text="Request a Consultation" />
            </div>
            <pre className="bg-gray-50 p-3 text-sm rounded overflow-auto">
              <code>{`<EstimateButton 
  text="Request a Consultation"
/>`}</code>
            </pre>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h4 className="font-medium text-lg mb-4">Without Icon</h4>
            <div className="flex justify-center mb-6">
              <EstimateButton withIcon={false} />
            </div>
            <pre className="bg-gray-50 p-3 text-sm rounded overflow-auto">
              <code>{`<EstimateButton 
  withIcon={false}
/>`}</code>
            </pre>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h4 className="font-medium text-lg mb-4">As Link</h4>
            <div className="flex justify-center mb-6">
              <EstimateButton href="#" />
            </div>
            <pre className="bg-gray-50 p-3 text-sm rounded overflow-auto">
              <code>{`<EstimateButton 
  href="/get-estimate"
/>`}</code>
            </pre>
          </div>
        </div>
      </div>
      
      {/* Typography Details */}
      <div className="mb-16">
        <h3 className="text-2xl font-semibold mb-6">Typography</h3>
        <div className="p-6 border rounded-lg">
          <div className="flex items-center gap-8">
            <div>
              <p className="mb-2 font-medium">Button Text Component</p>
              <P2>Get an Estimate</P2>
              <ul className="mt-4 text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Component: <code>ButtonText</code></li>
                <li>Font: Nunito Sans</li>
                <li>Weight: ExtrabBold (800)</li>
                <li>Size: Responsive (14px - 18px)</li>
                <li>Line Height: 120%</li>
              </ul>
            </div>
            
            <div className="border-l border-gray-200 pl-8">
              <p className="mb-2 font-medium">Sample HTML Output</p>
              <pre className="bg-gray-50 p-3 text-sm rounded overflow-auto">
                <code>{`<button class="inline-flex items-center justify-center transition-colors rounded py-3 px-5 gap-3 bg-[#2A2B2E] text-white group">
  <div class="relative w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform">
    <img src="/assets/icons/arrow-right.svg" alt="Button icon" ... />
  </div>
  <span class="text-center font-heading font-extrabold text-sm sm:text-sm md:text-base lg:text-base xl:text-lg xxl:text-lg 2xl:text-lg leading-none">
    Get an Estimate
  </span>
</button>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      {/* Documentation */}
      <div>
        <h3 className="text-2xl font-semibold mb-6">Implementation</h3>
        <pre className="bg-gray-50 p-4 rounded overflow-auto">
          <code>{`// Import the button
import { EstimateButton } from '../components/common/buttons';

// Basic usage (defaults to primary variant in light mode)
<EstimateButton />

// Secondary variant in dark mode
<EstimateButton 
  priority="secondary"
  mode="dark"
/>

// Custom text, with link
<EstimateButton 
  text="Request a Quote" 
  href="/contact"
/>

// Without icon
<EstimateButton withIcon={false} />

// Disabled state
<EstimateButton disabled />`}</code>
        </pre>
      </div>
    </div>
  );
};

export default GetAnEstimateShowcase;
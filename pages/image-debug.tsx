import Image from 'next/image';
import { useState } from 'react';
import Head from 'next/head';
import type { ReactElement } from 'react';

function ImageDebug() {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <>
      <Head>
        <title>Image Debug - No Layout</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Image Debug Page</h1>
      
      <div className="mb-8">
        <button 
          onClick={() => setShowSolution(!showSolution)}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Toggle Solution Examples
        </button>
      </div>

      {/* PROBLEMATIC EXAMPLES - These should trigger warnings */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-red-600">❌ PROBLEMATIC (Should show warnings)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Problem 1: Logo with responsive height classes */}
          <div className="border-2 border-red-500 p-4 rounded">
            <h3 className="font-semibold mb-2 text-red-600">❌ PROBLEMATIC: Logo with responsive max-height + w-auto</h3>
            <div className="border border-gray-300 p-2 rounded flex items-center">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Logo Test 1"
                width={140}
                height={24}
                className="max-h-[24px] sm:max-h-[26px] md:max-h-[28px] w-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              explicit width=140 height=24 + CSS max-h and w-auto
            </p>
          </div>

          {/* Problem 2: Image with w-full h-auto */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Image with w-full h-auto</h3>
            <div className="w-[300px] border border-gray-300 p-2 rounded">
              <Image 
                className="w-full h-auto rounded-md object-cover" 
                src="/assets/images/shared_projects_project-image5.png"
                alt="Project Test" 
                width={505}
                height={384}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              explicit width=505 height=384 + CSS w-full h-auto
            </p>
          </div>

          {/* Problem 3: Icon in sized container */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">Icon in sized container</h3>
            <div className="w-16 h-16 border border-gray-300 flex items-center justify-center">
              <Image 
                src="/assets/icons/architect-icon.svg" 
                alt="Icon Test" 
                width={24} 
                height={24}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              explicit width=24 height=24 inside w-16 h-16 container
            </p>
          </div>

        </div>
      </section>

      {/* DEFINITIVE TEST */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">🔬 DEFINITIVE TEST - Fresh Icons to Avoid Caching</h2>
        <p className="mb-4 text-sm text-gray-600">Using different icons to get fresh console warnings:</p>
        
        <div className="grid grid-cols-2 gap-4">
          
          <div className="p-4 bg-red-100 rounded border-2 border-red-500">
            <h3 className="font-semibold mb-2 text-red-600">❌ SHOULD WARN: Original Pattern</h3>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
              <Image
                src="/assets/icons/ic-date.svg"
                alt="Test Original Pattern"
                width={140}
                height={24}
                className="max-h-[24px] w-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">max-h + w-auto (original problem)</p>
          </div>

          <div className="p-4 bg-green-100 rounded border-2 border-green-500">
            <h3 className="font-semibold mb-2 text-green-600">✅ SHOULD NOT WARN: Both Constraints</h3>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
              <Image
                src="/assets/icons/ic-search.svg"
                alt="Test Both Constraints"
                width={140}
                height={24}
                className="max-w-[140px] max-h-[24px]"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">max-w + max-h (proposed solution)</p>
          </div>

          <div className="p-4 bg-blue-100 rounded border-2 border-blue-500">
            <h3 className="font-semibold mb-2 text-blue-600">🧪 TEST: Add width auto style</h3>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
              <Image
                src="/assets/icons/ic-filter.svg"
                alt="Test Width Auto Style"
                width={140}
                height={24}
                style={{ width: 'auto' }}
                className="max-h-[24px] w-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">style width auto (as warning suggests)</p>
          </div>

          <div className="p-4 bg-purple-100 rounded border-2 border-purple-500">
            <h3 className="font-semibold mb-2 text-purple-600">🧪 TEST: No CSS at all</h3>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
              <Image
                src="/assets/icons/ic-copy.svg"
                alt="Test No CSS"
                width={140}
                height={24}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">No CSS classes at all</p>
          </div>

        </div>
      </section>

      {/* SIMPLE TEST */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">🔬 SIMPLE TEST - Which approach works?</h2>
        <p className="mb-4 text-sm text-gray-600">Check console to see which approaches produce warnings:</p>
        
        <div className="mb-8 p-4 bg-yellow-100 rounded">
          <h3 className="font-semibold mb-2">🧪 TEST G: Both max-width AND max-height</h3>
          <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
            <Image
              src="/assets/icons/architect-icon.svg"
              alt="Test G - Both Constraints"
              width={140}
              height={24}
              className="max-w-[140px] max-h-[24px]"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Both max-width AND max-height (balanced constraints)</p>
        </div>

        <div className="mb-8 p-4 bg-blue-100 rounded">
          <h3 className="font-semibold mb-2">🧪 TEST H: No CSS constraints at all</h3>
          <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
            <Image
              src="/assets/icons/ic-sign.svg"
              alt="Test H - No CSS"
              width={140}
              height={24}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Pure intrinsic sizing - no CSS classes</p>
        </div>

        <div className="mb-8 p-4 bg-green-100 rounded">
          <h3 className="font-semibold mb-2">🧪 TEST I: Hypothesis - Use sizes for responsive</h3>
          <div className="border border-gray-300 p-2 rounded flex items-center justify-center">
            <Image
              src="/assets/icons/ic-key.svg"
              alt="Test I - Sizes Responsive"
              width={140}
              height={24}
              sizes="(max-width: 640px) 120px, (max-width: 768px) 130px, 140px"
              className="max-h-[24px] sm:max-h-[26px] md:max-h-[28px]"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Use sizes prop for responsive, remove w-auto</p>
        </div>
      </section>

      {/* DIRECT COMPARISON */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-purple-600">🔬 DIRECT COMPARISON - Same Pattern, Different Approaches</h2>
        <p className="mb-4 text-sm text-gray-600">Each uses same logo but different approach. Check console for warnings:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Test A: Original problematic */}
          <div className="border-2 border-red-500 p-3 rounded">
            <h4 className="font-semibold mb-2 text-red-600">A: PROBLEMATIC</h4>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center h-12">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Test A - Problematic"
                width={140}
                height={24}
                className="max-h-[24px] w-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">width+height props + max-h + w-auto CSS</p>
          </div>

          {/* Test B: Add style width auto */}
          <div className="border-2 border-blue-500 p-3 rounded">
            <h4 className="font-semibold mb-2 text-blue-600">B: + style width auto</h4>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center h-12">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Test B - Style Width Auto"
                width={140}
                height={24}
                style={{ width: 'auto' }}
                className="max-h-[24px] w-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">+ style width: auto</p>
          </div>

          {/* Test C: Remove w-auto CSS */}
          <div className="border-2 border-green-500 p-3 rounded">
            <h4 className="font-semibold mb-2 text-green-600">C: Remove w-auto</h4>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center h-12">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Test C - No W Auto"
                width={140}
                height={24}
                className="max-h-[24px]"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">Remove w-auto CSS class</p>
          </div>

          {/* Test D: No CSS on Image */}
          <div className="border-2 border-purple-500 p-3 rounded">
            <h4 className="font-semibold mb-2 text-purple-600">D: No CSS on Image</h4>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center h-12" style={{ maxHeight: '24px', overflow: 'hidden' }}>
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Test D - Container Sizing"
                width={140}
                height={24}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">Container handles sizing</p>
          </div>

          {/* Test E: Both style overrides */}
          <div className="border-2 border-orange-500 p-3 rounded">
            <h4 className="font-semibold mb-2 text-orange-600">E: style w&h auto</h4>
            <div className="border border-gray-300 p-2 rounded flex items-center justify-center h-12">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Test E - Both Style Auto"
                width={140}
                height={24}
                style={{ width: 'auto', height: 'auto' }}
                className="max-h-[24px] w-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">style width: auto, height: auto</p>
          </div>

          {/* Test F: Use fill */}
          <div className="border-2 border-teal-500 p-3 rounded">
            <h4 className="font-semibold mb-2 text-teal-600">F: fill prop</h4>
            <div className="border border-gray-300 p-2 rounded relative h-12 w-32">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="Test F - Fill Prop"
                fill
                className="object-contain"
                sizes="128px"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">fill + object-contain</p>
          </div>

        </div>
      </section>

      {/* SOLUTION ATTEMPTS */}
      {showSolution && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">🔧 SOLUTION ATTEMPTS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Solution 1: Add style with width and height auto */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 1: style auto (my previous attempt)</h3>
              <div className="border border-gray-300 p-2 rounded flex items-center">
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="Logo Solution 1"
                  width={140}
                  height={24}
                  style={{ width: 'auto', height: 'auto' }}
                  className="max-h-[24px] sm:max-h-[26px] md:max-h-[28px] w-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                + style=&#123;&#123; width: 'auto', height: 'auto' &#125;&#125; (FAILED)
              </p>
            </div>

            {/* Solution 1b: Use height auto only */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 1b: height auto only</h3>
              <div className="border border-gray-300 p-2 rounded flex items-center">
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="Logo Solution 1b"
                  width={140}
                  height={24}
                  style={{ height: 'auto' }}
                  className="max-h-[24px] sm:max-h-[26px] md:max-h-[28px] w-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                + style=&#123;&#123; height: 'auto' &#125;&#125; only
              </p>
            </div>

            {/* Solution 1c: Remove w-auto, use height constraint only */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 1c: height constraint only</h3>
              <div className="border border-gray-300 p-2 rounded flex items-center">
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="Logo Solution 1c"
                  width={140}
                  height={24}
                  className="max-h-[24px] sm:max-h-[26px] md:max-h-[28px]"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Remove w-auto, keep only height constraint
              </p>
            </div>

            {/* Solution 1d: Follow warning suggestion exactly - width auto style */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 1d: style width auto (warning suggestion)</h3>
              <div className="border border-gray-300 p-2 rounded flex items-center">
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="Logo Solution 1d"
                  width={140}
                  height={24}
                  style={{ width: 'auto' }}
                  className="max-h-[24px] sm:max-h-[26px] md:max-h-[28px] w-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                + style=&#123;&#123; width: 'auto' &#125;&#125; (warning suggestion)
              </p>
            </div>

            {/* Solution 1e: Remove CSS overrides completely */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 1e: No CSS overrides</h3>
              <div className="border border-gray-300 p-2 rounded flex items-center" style={{ maxHeight: '28px', overflow: 'hidden' }}>
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="Logo Solution 1e"
                  width={140}
                  height={24}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                No CSS on Image, container handles sizing
              </p>
            </div>

            {/* Solution 2: Remove explicit dimensions, use CSS only */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 2: CSS only</h3>
              <div className="w-[300px] border border-gray-300 p-2 rounded">
                <Image 
                  className="w-full h-auto rounded-md object-cover max-w-[505px]" 
                  src="/assets/images/shared_projects_project-image5.png"
                  alt="Project Solution 2" 
                  width={0}
                  height={0}
                  sizes="100vw"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                width=0 height=0 + sizes="100vw" + CSS
              </p>
            </div>

            {/* Solution 3: Use fill prop */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 3: fill prop</h3>
              <div className="w-[300px] h-[200px] border border-gray-300 p-2 rounded relative">
                <Image 
                  fill
                  className="object-contain" 
                  src="/assets/images/shared_projects_project-image5.png"
                  alt="Project Solution 3" 
                  sizes="300px"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                fill + object-contain + relative container
              </p>
            </div>

            {/* Solution 4: Exact intrinsic sizing */}
            <div className="border p-4 rounded">
              <h3 className="font-semibold mb-2">Solution 4: intrinsic only</h3>
              <div className="border border-gray-300 p-2 rounded flex items-center">
                <Image
                  src="/assets/logos/web_realtechee_horizontal_no_border.png"
                  alt="Logo Solution 4"
                  width={140}
                  height={24}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Only width=140 height=24, no CSS override
              </p>
            </div>

          </div>
        </section>
      )}

      {/* INSTRUCTIONS */}
      <section className="bg-gray-100 p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Open browser console and check for Image warnings</li>
          <li>The "PROBLEMATIC" section should show warnings</li>
          <li>Toggle to view "SOLUTION ATTEMPTS"</li>
          <li>Compare which solutions eliminate warnings</li>
          <li>Identify the pattern that works consistently</li>
        </ol>
        
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <p className="font-semibold">Expected Warning:</p>
          <p className="text-sm font-mono">
            Image with src "..." has either width or height modified, but not the other. 
            If you use CSS to change the size of your image, also include the styles 
            'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.
          </p>
        </div>
      </section>
      </div>
    </>
  );
}

// Exclude layout for this debug page
ImageDebug.getLayout = function getLayout(page: ReactElement) {
  return page;
};

export default ImageDebug;
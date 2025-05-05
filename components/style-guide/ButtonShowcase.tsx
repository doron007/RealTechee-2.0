import React from 'react';
import Button, { ButtonVariant, ButtonState } from '../common/buttons/Button';

interface ButtonGroupProps {
  variant: ButtonVariant;
  label: string;
}

/**
 * ButtonGroup component to display a row of buttons in different states
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({ variant, label }) => {
  const states: ButtonState[] = ['normal', 'hover', 'pressed', 'disabled'];
  
  return (
    <div className="flex flex-col space-y-4 mb-8">
      <div className="flex">
        <div className="w-32 flex items-center">
          <span className="text-lg font-normal">{label}</span>
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4">
          {states.map((state) => (
            <div key={state} className="flex flex-col items-center">
              <Button 
                variant={variant} 
                forceState={state}
              >
                Click
              </Button>
              <span className="mt-2 text-sm text-gray-500 capitalize">{state}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * ButtonShowcase component that demonstrates all button variants and states
 */
const ButtonShowcase: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Button System</h2>
      
      <div className="mb-6">
        <div className="flex border-b border-gray-200 pb-3 mb-6">
          <div className="w-32"></div>
          <div className="flex-1 grid grid-cols-4 gap-4">
            <div className="text-center text-gray-500">Normal</div>
            <div className="text-center text-gray-500">Hover</div>
            <div className="text-center text-gray-500">Pressed</div>
            <div className="text-center text-gray-500">Disabled</div>
          </div>
        </div>
        
        <ButtonGroup variant="primary" label="Primary" />
        <ButtonGroup variant="secondary" label="Secondary" />
        <ButtonGroup variant="tertiary" label="Tertiary" />
      </div>
      
      <h3 className="text-xl font-bold mb-4">Button Sizes</h3>
      <div className="flex space-x-4 mb-8">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
      </div>
      
      <h3 className="text-xl font-bold mb-4">With Icons</h3>
      <div className="flex space-x-4 mb-8">
        <Button variant="primary" withIcon iconPosition="left">
          Left Icon
        </Button>
        <Button variant="primary" withIcon iconPosition="right">
          Right Icon
        </Button>
      </div>
      
      <h3 className="text-xl font-bold mb-4">Full Width</h3>
      <div className="mb-8">
        <Button variant="primary" fullWidth>
          Full Width Button
        </Button>
      </div>
      
      <h3 className="text-xl font-bold mb-4">As Links</h3>
      <div className="flex space-x-4">
        <Button variant="primary" href="#">Primary Link</Button>
        <Button variant="secondary" href="#">Secondary Link</Button>
        <Button variant="tertiary" href="#">Tertiary Link</Button>
      </div>
    </div>
  );
};

export default ButtonShowcase;
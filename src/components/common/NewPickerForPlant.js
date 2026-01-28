import React from 'react';
import GenericDropdown from './GenericDropdown';

const NewPickerForPlant = ({ plants, selected, valueChange, pickerStyle }) => {
  return (
    <GenericDropdown
      label="Select Plant"
      data={plants}
      value={selected?.id || selected}
      onValueChange={val => {
        const selectedObj = plants.find(p => p.id === val);
        valueChange(selectedObj);
      }}
      placeholder="Select Plant"
      style={pickerStyle}
    />
  );
};

export default NewPickerForPlant;

import React from 'react';
import GenericDropdown from './GenericDropdown';

const NewLocationPicker = ({
  locations,
  selected,
  valueChange,
  pickerStyle,
}) => {
  return (
    <GenericDropdown
      label="Select Location"
      data={locations}
      value={selected?.id || selected}
      onValueChange={val => {
        const selectedObj = locations.find(l => l.id == val);
        valueChange(selectedObj);
      }}
      placeholder="Select Location"
      style={pickerStyle}
    />
  );
};

export default NewLocationPicker;

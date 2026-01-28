import React from 'react';
import GenericDropdown from './GenericDropdown';

const CustomDropDown = ({
  data,
  value,
  onValueChange,
  style,
  label,
  placeholder,
  error,
}) => {
  return (
    <GenericDropdown
      data={data}
      value={value?.id ?? value}
      onValueChange={val => {
        // Find object if data is available, otherwise return val (id)
        const selectedObj = Array.isArray(data)
          ? data.find(item => item.id === val || item.value === val)
          : val;
        onValueChange(selectedObj || val);
      }}
      label={label}
      placeholder={placeholder || 'Select Option'}
      style={style}
      error={error}
    />
  );
};

export default CustomDropDown;

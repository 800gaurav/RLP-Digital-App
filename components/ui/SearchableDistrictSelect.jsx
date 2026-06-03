import React from 'react';
import { RAJASTHAN_DISTRICTS } from '../../constants/rajasthanDistricts';
import SearchableOptionSelect from './SearchableOptionSelect';

export default function SearchableDistrictSelect({
  value,
  onSelect,
  placeholder = 'Search and choose district',
  error = false,
  disabled = false,
  open,
  onOpenChange,
}) {
  return (
    <SearchableOptionSelect
      value={value}
      onSelect={onSelect}
      options={RAJASTHAN_DISTRICTS}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      emptyText="No district found"
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

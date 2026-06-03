import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import SearchableOptionSelect from './SearchableOptionSelect';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';
import { getVidhansabhasForDistrict, RAJASTHAN_VIDHANSABHAS } from '../../constants/rajasthanVidhansabhas';

const OTHER_OPTION = 'Other';

export default function SearchableVidhansabhaSelect({
  district,
  value,
  onSelect,
  error = false,
  onOtherModeChange,
  open,
  onOpenChange,
}) {
  const [isOther, setIsOther] = useState(false);

  const districtOptions = useMemo(() => {
    const selectedDistrictOptions = getVidhansabhasForDistrict(district);
    return selectedDistrictOptions.length ? selectedDistrictOptions : RAJASTHAN_VIDHANSABHAS;
  }, [district]);

  useEffect(() => {
    if (!value) {
      setIsOther(false);
      return;
    }
    setIsOther(!districtOptions.includes(value));
  }, [districtOptions, value]);

  useEffect(() => {
    if (typeof onOtherModeChange === 'function') onOtherModeChange(isOther);
  }, [isOther, onOtherModeChange]);

  const options = useMemo(() => [...districtOptions, OTHER_OPTION], [districtOptions]);

  return (
    <View>
      <SearchableOptionSelect
        value={isOther ? OTHER_OPTION : value}
        onSelect={(selectedValue) => {
          if (selectedValue === OTHER_OPTION) {
            setIsOther(true);
            if (districtOptions.includes(value)) onSelect('');
            return;
          }
          setIsOther(false);
          onSelect(selectedValue);
        }}
        options={options}
        placeholder={district ? 'Search or choose Vidhansabha' : 'Choose Vidhansabha, or select Other'}
        emptyText="No Vidhansabha found"
        error={error}
        open={open}
        onOpenChange={onOpenChange}
      />
      {isOther ? (
        <View style={styles.otherWrap}>
          <Text style={styles.otherLabel}>Other Vidhansabha</Text>
          <TextInput
            style={[styles.otherInput, error && styles.otherInputError]}
            value={districtOptions.includes(value) ? '' : value}
            onChangeText={onSelect}
            placeholder="Enter your Vidhansabha"
            placeholderTextColor={Colors.outline}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  otherWrap: { marginTop: 10, gap: 6 },
  otherLabel: { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.onSurfaceVariant },
  otherInput: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerLow,
  },
  otherInputError: { borderColor: Colors.error },
});

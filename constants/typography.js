// RLP Design System — Typography Scale
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
};

export const Typography = {
  displayLg: { fontFamily: FontFamily.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.64 },
  displayMd: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.24 },
  titleLg: { fontFamily: FontFamily.semiBold, fontSize: 20, lineHeight: 28 },
  titleMd: { fontFamily: FontFamily.semiBold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  labelLg: { fontFamily: FontFamily.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  labelSm: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 14 },
};

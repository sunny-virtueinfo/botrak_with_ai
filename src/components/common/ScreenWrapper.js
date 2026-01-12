import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../theme';
import CustomHeader from './CustomHeader';

const ScreenWrapper = ({
  children,
  title,
  showBack,
  showMenu,
  rightAction,
  scrollable = false,
  contentContainerStyle,
  headerTransparent = false,
  headerGradientColors,
  headerTextColor,
  headerIconColor,
  style,
  onBackPress,
}) => {
  return (
    <LinearGradient
      colors={COLORS.gradients?.background || ['#F8FAFC', '#EFF6FF', '#E0F2FE']}
      style={[styles.container, style]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        {(title || showBack || showMenu) && (
          <CustomHeader
            title={title}
            showBack={showBack}
            showMenu={showMenu}
            rightAction={rightAction}
            transparent={headerTransparent}
            gradientColors={headerGradientColors}
            textColor={headerTextColor}
            iconColor={headerIconColor}
            onBackPress={onBackPress}
          />
        )}

        <View style={styles.safeAreaContent}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                contentContainerStyle,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, contentContainerStyle]}>
              {children}
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ScreenWrapper;

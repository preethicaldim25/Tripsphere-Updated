import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutAnimation, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/shared/themedtext';
import { useTheme } from '@/context/themecontext';

interface Props {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const Collapsible: React.FC<Props> = ({
  title,
  children,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { colors } = useTheme();

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpand} style={styles.header}>
        <ThemedText variant="h3">{title}</ThemedText>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    paddingBottom: 12,
  },
});
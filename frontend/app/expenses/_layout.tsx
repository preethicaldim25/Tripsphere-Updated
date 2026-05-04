import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="add" 
        options={{ 
          title: 'Add Expense',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
}
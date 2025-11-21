import { supabase } from "@/integrations/supabase/client";

export async function generateMealImage(prompt: string, mealId: string) {
  const { data, error } = await supabase.functions.invoke('generate-meal-image', {
    body: { prompt, mealId }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

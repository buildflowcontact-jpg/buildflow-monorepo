import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues } from "react-hook-form";

/**
 * Hook utilitaire pour factoriser l’usage de react-hook-form + zod
 * @param schema Schéma zod du formulaire
 * @param options Options additionnelles pour useForm
 */
export function useZodForm<
  TForm extends FieldValues = FieldValues
>(
  schema: any,
  options?: Omit<UseFormProps<TForm>, "resolver">
): UseFormReturn<TForm> {
  return useForm<TForm>({
    resolver: zodResolver(schema) as any,
    ...options,
  });
}

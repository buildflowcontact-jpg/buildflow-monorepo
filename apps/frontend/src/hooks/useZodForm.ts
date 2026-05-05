import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType, ZodTypeDef, TypeOf } from "zod";

/**
 * Hook utilitaire pour factoriser l’usage de react-hook-form + zod
 * @param schema Schéma zod du formulaire
 * @param options Options additionnelles pour useForm
 */
export function useZodForm<
  TSchema extends ZodType<any, ZodTypeDef, any>,
  TForm = TypeOf<TSchema>
>(
  schema: TSchema,
  options?: Omit<UseFormProps<TForm>, "resolver">
): UseFormReturn<TForm> {
  return useForm<TForm>({
    resolver: zodResolver(schema),
    ...options,
  });
}

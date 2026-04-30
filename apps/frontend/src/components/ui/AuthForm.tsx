import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signInWithMagicLink } from "../../modules/chantier/hooks/useAuth"
import { Button } from "./button"

const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" })
})

type FormData = z.infer<typeof formSchema>

export function AuthForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      await signInWithMagicLink(data.email)
      setSent(true)
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'envoi du lien.")
    }
  }

  if (sent || isSubmitSuccessful) {
    return <div className="text-green-700 text-center">Un lien de connexion a été envoyé à votre adresse email.</div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
          {...register("email")}
          required
        />
        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
      </div>
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Envoi..." : "Recevoir un lien de connexion"}
      </Button>
    </form>
  )
}

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const formSchema = z.object({
  height: z.string().min(2, {
    message: "Height must be at least 2 characters.",
  }),
  weight: z.string().min(2, {
    message: "Weight must be at least 2 characters.",
  }),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
  allergies: z.string(),
  medications: z.string(),
  conditions: z.string(),
})

export function HealthForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      height: "",
      weight: "",
      bloodType: "O+",
      allergies: "",
      medications: "",
      conditions: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input placeholder="175" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input placeholder="70" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bloodType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Blood Type</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4">
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
                    <FormItem key={type}>
                      <FormControl>
                        <RadioGroupItem value={type} />
                      </FormControl>
                      <FormLabel className="font-normal">{type}</FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allergies</FormLabel>
              <FormControl>
                <Textarea placeholder="List any allergies you have..." className="resize-none" {...field} />
              </FormControl>
              <FormDescription>Include food, medication, and environmental allergies</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Medications</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any medications you're currently taking..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Include dosage and frequency if known</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical Conditions</FormLabel>
              <FormControl>
                <Textarea placeholder="List any existing medical conditions..." className="resize-none" {...field} />
              </FormControl>
              <FormDescription>Include both current and past medical conditions</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save Health Information</Button>
      </form>
    </Form>
  )
}


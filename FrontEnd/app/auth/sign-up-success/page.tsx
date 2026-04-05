import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IndianRupee, Mail, CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-card border-border text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FreelanceFinance</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Check your email</CardTitle>
          <CardDescription className="text-muted-foreground">
            We&apos;ve sent you a confirmation link to verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-sm text-foreground">
                Click the link in the email to activate your account
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">
              Back to login
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive an email? Check your spam folder or try signing up again.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

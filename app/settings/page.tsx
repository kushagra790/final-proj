import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { BellIcon, ShieldCheckIcon, DevicePhoneMobileIcon, GlobeAltIcon } from "@heroicons/react/24/solid"

export default function SettingsPage() {
  return (
    <div className="w-full grid gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences.</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you want to receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              { label: "Push Notifications", description: "Receive notifications on your device" },
              { label: "Email Notifications", description: "Get updates in your inbox" },
              { label: "SMS Notifications", description: "Receive text messages for urgent updates" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor={item.label}>{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch id={item.label} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4" />
              <CardTitle>Privacy</CardTitle>
            </div>
            <CardDescription>Manage your privacy settings.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              { label: "Share Health Data", description: "Allow sharing with healthcare providers" },
              { label: "Anonymous Analytics", description: "Help improve the app with anonymous data" },
              { label: "Research Participation", description: "Participate in health research studies" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor={item.label}>{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch id={item.label} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <CardTitle>Device Settings</CardTitle>
              </div>
              <CardDescription>Configure your device preferences.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                { label: "Sync Data", description: "Keep your data in sync across devices" },
                { label: "Offline Mode", description: "Access your data without internet" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.label}>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch id={item.label} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="h-4 w-4" />
                <CardTitle>Regional Settings</CardTitle>
              </div>
              <CardDescription>Configure your regional preferences.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                { label: "Use Metric System", description: "Display measurements in metric units" },
                { label: "24-Hour Time", description: "Use 24-hour time format" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.label}>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch id={item.label} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Loader2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AccountVerificationSectionProps {
  driverId: string;
  currentAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
}

export function AccountVerificationSection({
  driverId,
  currentAccountName,
  bankAccountNumber,
  bankName,
}: AccountVerificationSectionProps) {
  const [verifying, setVerifying] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualAccountName, setManualAccountName] = useState("");
  const [accountNameFromApi, setAccountNameFromApi] = useState(currentAccountName || "");
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Fetch list of banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch("https://api.paystack.co/bank?perPage=50", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
          },
        });
        const data = await response.json();
        if (data.status && data.data) {
          setBanks(data.data);
          // Pre-select current bank if available
          if (bankName) {
            const matching = data.data.find(
              (b: any) => b.name.toLowerCase() === bankName.toLowerCase()
            );
            if (matching) {
              setSelectedBankCode(matching.code);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch banks:", error);
        toast.error("Could not load bank list");
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [bankName]);

  const handleVerifyAccount = async () => {
    if (!bankAccountNumber || !selectedBankCode) {
      toast.error("Please provide account number and select a bank");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/driver/account-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          action: "verify",
          accountNumber: bankAccountNumber,
          bankCode: selectedBankCode,
          driverId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAccountNameFromApi(data.accountName);
        setManualEntry(false);
        toast.success("Account verified successfully!");
      } else if (response.status === 429 || data.requiresManualEntry) {
        setManualEntry(true);
        toast.warning("Rate limit reached. Please enter account name manually.");
      } else {
        toast.error(data.error || "Verification failed");
        setManualEntry(true); // Allow manual entry as fallback
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed. Please try manually.");
      setManualEntry(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveManualAccountName = async () => {
    if (!manualAccountName.trim()) {
      toast.error("Please enter an account name");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/driver/account-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          action: "saveManual",
          accountName: manualAccountName,
          driverId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAccountNameFromApi(data.accountName);
        setManualEntry(false);
        setManualAccountName("");
        toast.success("Account name saved successfully!");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save account name");
    } finally {
      setVerifying(false);
    }
  };

  const hasAccountName = !!accountNameFromApi;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Bank Account Verification
        </CardTitle>
        <CardDescription>
          Verify your bank account to receive payment transfers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        {hasAccountName && !manualEntry && (
          <Alert className="border-green-200 bg-green-500 dark:bg-green-900/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              <strong>Account verified:</strong> {accountNameFromApi}
              <Button
                variant="link"
                size="sm"
                className="ml-2 h-auto p-0"
                onClick={() => setManualEntry(true)}
              >
                Re-verify
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Account Details Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 dark:bg-gray-900 p-4 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bank Name
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{bankName || "Not set"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Number
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {bankAccountNumber || "Not set"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Account Name
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{accountNameFromApi || "Not set"}</p>
          </div>
        </div>

        {/* Verification Form */}
        {(!hasAccountName || manualEntry) && (
          <div className="space-y-4 border-t pt-4">
            {!manualEntry && !hasAccountName && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Select Bank
                  </label>
                  <Select value={selectedBankCode} onValueChange={setSelectedBankCode}>
                    <SelectTrigger disabled={loadingBanks}>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank, index) => (
                        <SelectItem key={`${bank.code}-${index}`} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleVerifyAccount}
                  disabled={verifying || !selectedBankCode || loadingBanks}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Account with Bank"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setManualEntry(true)}
                  className="w-full"
                >
                  Enter Account Name Manually
                </Button>
              </>
            )}

            {/* Manual Entry Form */}
            {manualEntry && (
              <div className="space-y-3 bg-blue-500/10 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200">
                <Alert className="border-blue-200 bg-blue-500/10 dark:bg-blue-900/10">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    Enter the name as it appears on your bank account
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Account Holder Name
                  </label>
                  <Input
                    placeholder="Enter your full name as shown in bank records"
                    value={manualAccountName}
                    onChange={(e) => setManualAccountName(e.target.value)}
                    disabled={verifying}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveManualAccountName}
                    disabled={verifying || !manualAccountName.trim()}
                    className="flex-1"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Account Name"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setManualEntry(false);
                      setManualAccountName("");
                    }}
                    disabled={verifying}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">Why verify your account?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensures accurate payment transfers</li>
            <li>Matches your bank account records</li>
            <li>Required for payout processing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

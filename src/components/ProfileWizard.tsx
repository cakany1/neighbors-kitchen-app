import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, MapPin, Phone, CheckCircle, Loader2, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  userId: string;
  missingPhoto: boolean;
  missingAddress: boolean;
  missingPhone: boolean;
  isCouple?: boolean;
  partnerPhotoMissing?: boolean;
}

export function ProfileWizard({
  open,
  onClose,
  onComplete,
  userId,
  missingPhoto,
  missingAddress,
  missingPhone,
  isCouple = false,
  partnerPhotoMissing = false,
}: ProfileWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Calculate steps needed
  const steps: ("photo" | "partner_photo" | "address" | "phone")[] = [];
  if (missingPhoto) steps.push("photo");
  if (isCouple && partnerPhotoMissing) steps.push("partner_photo");
  if (missingAddress) steps.push("address");
  if (missingPhone) steps.push("phone");

  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [partnerPhotoFile, setPartnerPhotoFile] = useState<File | null>(null);
  const [partnerPhotoPreview, setPartnerPhotoPreview] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 100;
  const currentStepType = steps[currentStep];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, isPartner = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isPartner) {
        setPartnerPhotoFile(file);
        setPartnerPhotoPreview(URL.createObjectURL(file));
      } else {
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${folder}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const geocodeAddress = async (fullAddress: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`,
        { headers: { "User-Agent": "NeighborsKitchen/1.0" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
    return null;
  };

  const handleNext = async () => {
    setIsSaving(true);

    try {
      if (currentStepType === "photo" && photoFile) {
        setIsUploading(true);
        const photoUrl = await uploadPhoto(photoFile, "avatar");
        if (photoUrl) {
          await supabase
            .from("profiles")
            .update({ avatar_url: photoUrl })
            .eq("id", userId);
        } else {
          toast.error(t("wizard.photo_upload_failed"));
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      }

      if (currentStepType === "partner_photo" && partnerPhotoFile) {
        setIsUploading(true);
        const partnerPhotoUrl = await uploadPhoto(partnerPhotoFile, "partner");
        if (partnerPhotoUrl) {
          await supabase
            .from("profiles")
            .update({ partner_photo_url: partnerPhotoUrl })
            .eq("id", userId);
        } else {
          toast.error(t("wizard.photo_upload_failed"));
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      }

      if (currentStepType === "address") {
        if (!address.trim() || !city.trim()) {
          toast.error(t("wizard.address_required"));
          setIsSaving(false);
          return;
        }

        const fullAddress = `${address}, ${postalCode} ${city}, Switzerland`.trim();
        const coords = await geocodeAddress(fullAddress);

        await supabase
          .from("profiles")
          .update({
            private_address: address,
            private_city: city,
            private_postal_code: postalCode,
            latitude: coords?.lat || null,
            longitude: coords?.lon || null,
          })
          .eq("id", userId);
      }

      if (currentStepType === "phone") {
        if (!phone.trim()) {
          toast.error(t("wizard.phone_required"));
          setIsSaving(false);
          return;
        }

        await supabase
          .from("profiles")
          .update({ phone_number: phone })
          .eq("id", userId);
      }

      // Move to next step or complete
      if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // All done!
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        toast.success(t("wizard.profile_complete"));
        onComplete();
      }
    } catch (error: any) {
      console.error("Wizard step error:", error);
      toast.error(error.message || t("wizard.save_failed"));
    }

    setIsSaving(false);
  };

  const canProceed = () => {
    switch (currentStepType) {
      case "photo":
        return !!photoFile;
      case "partner_photo":
        return !!partnerPhotoFile;
      case "address":
        return address.trim() !== "" && city.trim() !== "";
      case "phone":
        return phone.trim() !== "";
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStepType) {
      case "photo":
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  {t("wizard.choose_photo")}
                </div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e, false)}
                />
              </Label>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t("wizard.photo_hint")}
            </p>
          </div>
        );

      case "partner_photo":
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              {partnerPhotoPreview ? (
                <img
                  src={partnerPhotoPreview}
                  alt="Partner Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-secondary"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <Label htmlFor="partner-photo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  {t("wizard.choose_partner_photo")}
                </div>
                <Input
                  id="partner-photo-upload"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e, true)}
                />
              </Label>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t("wizard.partner_photo_hint")}
            </p>
          </div>
        );

      case "address":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t("wizard.street_address")}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("wizard.street_placeholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">{t("wizard.postal_code")}</Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="4051"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("wizard.city")}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Basel"
                />
              </div>
            </div>
            <Alert>
              <MapPin className="w-4 h-4" />
              <AlertDescription className="text-xs">
                {t("wizard.address_privacy_note")}
              </AlertDescription>
            </Alert>
          </div>
        );

      case "phone":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("wizard.phone_number")}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+41 79 123 45 67"
              />
            </div>
            <Alert>
              <Phone className="w-4 h-4" />
              <AlertDescription className="text-xs">
                {t("wizard.phone_privacy_note")}
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepIcon = () => {
    switch (currentStepType) {
      case "photo":
      case "partner_photo":
        return <Camera className="w-5 h-5" />;
      case "address":
        return <MapPin className="w-5 h-5" />;
      case "phone":
        return <Phone className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStepType) {
      case "photo":
        return t("wizard.step_photo_title");
      case "partner_photo":
        return t("wizard.step_partner_photo_title");
      case "address":
        return t("wizard.step_address_title");
      case "phone":
        return t("wizard.step_phone_title");
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStepType) {
      case "photo":
        return t("wizard.step_photo_desc");
      case "partner_photo":
        return t("wizard.step_partner_photo_desc");
      case "address":
        return t("wizard.step_address_desc");
      case "phone":
        return t("wizard.step_phone_desc");
      default:
        return "";
    }
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            {getStepIcon()}
            <span className="text-sm font-medium">
              {t("wizard.step_counter", { current: currentStep + 1, total: totalSteps })}
            </span>
          </div>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <div className="py-4">{renderStepContent()}</div>

        <div className="flex justify-between gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {t("wizard.later")}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed() || isSaving}>
            {isSaving || isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("wizard.saving")}
              </>
            ) : currentStep < totalSteps - 1 ? (
              t("wizard.next")
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("wizard.complete")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

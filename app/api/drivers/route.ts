import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { uploadFileWithServiceRole } from "@/lib/upload-file";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const userId = formData.get("userId") as string;
    const vehicleType = formData.get("vehicleType") as string;
    const plateNumber = formData.get("plateNumber") as string;
    const unionName = formData.get("unionName") as string;
    const operatingZonesStr = formData.get("operatingZones") as string;
    const bankName = formData.get("bankName") as string;
    const bankAccountNumber = formData.get("bankAccountNumber") as string;
    const emergencyContact = formData.get("emergencyContact") as string;

    // File uploads
    const vehiclePictureFile = formData.get("vehiclePicture") as File | null;
    const licensePictureFile = formData.get("licensePicture") as File | null;

    // Validate required fields
    if (!userId || !vehicleType || !plateNumber || !bankName || !bankAccountNumber) {
      console.error("Missing driver fields:", {
        userId: userId ? "✓" : "missing",
        vehicleType: vehicleType ? "✓" : "missing",
        plateNumber: plateNumber ? "✓" : "missing",
        unionName: unionName ? "✓" : "missing (optional)",
        bankName: bankName ? "✓" : "missing",
        bankAccountNumber: bankAccountNumber ? "✓" : "missing",
        operatingZones: operatingZonesStr ? "✓" : "missing",
        emergencyContact: emergencyContact ? "✓" : "missing (optional)",
      })
      return NextResponse.json(
        { 
          error: "Missing required driver fields",
          details: {
            userId: !userId ? "User ID required" : null,
            vehicleType: !vehicleType ? "Vehicle type required" : null,
            plateNumber: !plateNumber ? "Plate number required" : null,
            bankName: !bankName ? "Bank name required" : null,
            bankAccountNumber: !bankAccountNumber ? "Bank account number required" : null,
          }
        },
        { status: 400 }
      );
    }

    // Parse operating zones
    let operatingZones: string[] = [];
    try {
      operatingZones = JSON.parse(operatingZonesStr || "[]");
    } catch {
      operatingZones = [];
    }

    // Upload vehicle picture if provided
    let vehiclePictureUrl: string | null = null;
    if (vehiclePictureFile && vehiclePictureFile.size > 0) {
      try {
        const buffer = Buffer.from(await vehiclePictureFile.arrayBuffer());
        const timestamp = Date.now();
        const filePath = `${userId}/${timestamp}-vehicle.${vehiclePictureFile.name.split(".").pop()}`;
        
        const uploadResult = await uploadFileWithServiceRole(
          "vehicle-pictures",
          filePath,
          buffer,
          vehiclePictureFile.type
        );
        vehiclePictureUrl = uploadResult.url;
      } catch (error) {
        console.error("Error uploading vehicle picture:", error);
      }
    }

    // Upload license picture if provided
    let licensePictureUrl: string | null = null;
    if (licensePictureFile && licensePictureFile.size > 0) {
      try {
        const buffer = Buffer.from(await licensePictureFile.arrayBuffer());
        const timestamp = Date.now();
        const filePath = `${userId}/${timestamp}-license.${licensePictureFile.name.split(".").pop()}`;
        
        const uploadResult = await uploadFileWithServiceRole(
          "license-documents",
          filePath,
          buffer,
          licensePictureFile.type
        );
        licensePictureUrl = uploadResult.url;
      } catch (error) {
        console.error("Error uploading license picture:", error);
      }
    }

    // Create driver profile
    const { data, error } = await supabase
      .from("drivers")
      .insert([
        {
          user_id: userId,
          vehicle_type: vehicleType,
          plate_number: plateNumber,
          union_name: unionName,
          operating_zones: operatingZones,
          bank_name: bankName,
          bank_account_number: bankAccountNumber,
          emergency_contact: emergencyContact,
          vehicle_picture_url: vehiclePictureUrl,
          license_picture_url: licensePictureUrl,
          verified: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating driver profile:", error);
      return NextResponse.json(
        { error: "Failed to create driver profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Driver creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

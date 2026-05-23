import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}

export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full items-center justify-center bg-[#ff9203] text-[72px] font-bold text-white">
        CK
      </div>
    ),
    size
  )
}
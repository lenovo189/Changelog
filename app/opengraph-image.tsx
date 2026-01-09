import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Changelog Generator";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "white",
                    backgroundImage:
                        "linear-gradient(to bottom right, #E0F2FE, #DBEAFE, #FAE8FF)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: 60,
                            fontWeight: 800,
                            color: "#0F172A",
                            marginBottom: 20,
                            letterSpacing: "-0.025em",
                        }}
                    >
                        Changelog Generator
                    </div>
                    <div
                        style={{
                            fontSize: 30,
                            color: "#475569",
                            maxWidth: 800,
                            lineHeight: 1.4,
                        }}
                    >
                        Generate changelog pages from your releases with ease.
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}

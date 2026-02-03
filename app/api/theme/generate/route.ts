import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `Analyze this website screenshot and extract the primary color palette. 
        Return ONLY a JSON object with the following keys:
        - bg: The main background color (hex code)
        - text: The primary text color (hex code)
        - accent: The primary brand or action color (hex code)
        - secondary: A supporting color for borders or secondary text (hex code)
        
        Ensure the colors have good contrast and represent the website's aesthetic.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Extract JSON from the response (Gemini might wrap it in markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse color palette from AI response");
        }

        const colors = JSON.parse(jsonMatch[0]);

        return NextResponse.json(colors);
    } catch (error: any) {
        console.error("Gemini Error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate theme" }, { status: 500 });
    }
}

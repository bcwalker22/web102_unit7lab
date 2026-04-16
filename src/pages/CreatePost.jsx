import { useState } from 'react'
import './CreatePost.css'
import { supabase } from '../client'

const CreatePost = () => {

    const [post, setPost] = useState({ title: "", author: "", description: "" })
    const [isGenerating, setIsGenerating] = useState(false)

    const handleChange = (event) => {
        const { name, value } = event.target
        setPost((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY
    const LLM_ENDPOINT = import.meta.env.VITE_LLM_ENDPOINT

    const createPost = async (event) => {
        event.preventDefault()
        setIsGenerating(true)

        try {
            // 1. CALL AI
            const response = await fetch(LLM_ENDPOINT + 'api/v1/messages', {
                method: "POST",
                body: JSON.stringify({
                    model: "openai/gemma4:26b",
                    messages: [
                        {
                            role: "user",
                            content: `Analyze this Gen Z challenge: "${post.description}". 
Provide a spiciness rating (1-10) and a one-word category. 
Respond ONLY in JSON format: {"rating": number, "category": "string"}`
                        }
                    ]
                }),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${LLM_API_KEY}`,
                },
            })

            let aiResult = await response.json()
            aiResult = aiResult["content"][0]["text"]

            // CLEAN JSON (AI sometimes wraps it)
            let cleanJson = aiResult.trim()
            if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3)
            if (cleanJson.startsWith("json")) cleanJson = cleanJson.slice(4)
            if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3)

            let parsedResult = JSON.parse(cleanJson)
            if (parsedResult.content) parsedResult = JSON.parse(parsedResult.content)

            const { rating, category } = parsedResult

            // 2. SAVE TO DATABASE
            await supabase
                .from('Posts')
                .insert({
                    title: post.title,
                    author: post.author,
                    description: post.description,
                    spiciness: rating,
                    category: category
                })
                .select()

            window.location = "/"

        } catch (error) {
            console.error("AI failed:", error)
            setIsGenerating(false)
        }
    }

    // LOADING SCREEN
    if (isGenerating) {
        return (
            <div>
                <h2>Analyzing Gen Z Slang... 🧠</h2>
                <p>AI is cooking...</p>
            </div>
        )
    }

    return (
        <div>
            <form>
                <label>Title</label><br />
                <input name="title" onChange={handleChange} /><br /><br />

                <label>Author</label><br />
                <input name="author" onChange={handleChange} /><br /><br />

                <label>Description</label><br />
                <textarea name="description" onChange={handleChange}></textarea><br />

                <input type="submit" value="Submit" onClick={createPost} />
            </form>
        </div>
    )
}

export default CreatePost
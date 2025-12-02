import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiGetAIInsights, apiChatWithAI, type AIInsight } from "@/services/api";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIInsights = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your HomeNetAI assistant powered by Google Gemini. I can help you with weather forecasts, smart home automation, and energy optimization. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoadingInsights(true);
      const response = await apiGetAIInsights();
      setInsights(response.insights);
    } catch (error) {
      console.error("Failed to load AI insights:", error);
      setInsights([
        {
          type: "error",
          title: "Unable to load insights",
          message: "Please make sure you have configured your Gemini API key in the backend.",
        },
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || sendingMessage) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSendingMessage(true);

    try {
      const response = await apiChatWithAI(input, conversationId);
      
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(response.timestamp),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please make sure the Gemini API is configured correctly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
          AI Insights
        </h1>
        <p className="text-muted-foreground mt-2">
          Intelligent recommendations and chat assistant
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Insights Panel */}
        <div className="space-y-4">
          <Card className="glass-card border-ai-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-ai-primary" />
                Current Insights
              </CardTitle>
              <CardDescription>
                AI-generated recommendations based on your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingInsights ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-ai-primary" />
                </div>
              ) : insights.length > 0 ? (
                insights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5 border border-ai-primary/10 animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">
                  No insights available. Add locations to get AI-powered recommendations.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Energy Optimization Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-smart-primary/10 border border-smart-primary/20">
                <p className="text-sm">💡 Turn off lights when not in use to save up to 15% on energy costs</p>
              </div>
              <div className="p-3 rounded-lg bg-smart-primary/10 border border-smart-primary/20">
                <p className="text-sm">🌡️ Lower thermostat by 2°F in winter to reduce heating costs by 10%</p>
              </div>
              <div className="p-3 rounded-lg bg-smart-primary/10 border border-smart-primary/20">
                <p className="text-sm">🔌 Unplug devices when not in use to eliminate phantom power draw</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Assistant */}
        <Card className="glass-card flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-ai-primary" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Ask me anything about weather, devices, or automation
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-ai-primary to-ai-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-weather-primary to-weather-secondary text-white"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-weather-primary to-weather-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-to-r from-ai-primary to-ai-secondary hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIInsights;

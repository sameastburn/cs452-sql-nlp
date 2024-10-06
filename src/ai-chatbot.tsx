import { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface ComponentProps {
  db: any;
  generateSQLQuery: (userInput: string, strategy: string) => Promise<string | null>;
  executeSQLQuery: (query: string) => any;
  getFriendlyResponse: (queryResult: string, question: string) => Promise<string>;
}

export default function Component({ generateSQLQuery, executeSQLQuery, getFriendlyResponse }: ComponentProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I can help you generate SQL queries for your calendar events database. What would you like to know?", sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('zero-shot');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const userMessage: Message = { id: messages.length + 1, text: input, sender: 'user' };
      setMessages([...messages, userMessage]);
      setInput('');

      const sqlQuery = await generateSQLQuery(input, selectedStrategy);
      if (sqlQuery) {
        const aiMessage: Message = { id: messages.length + 2, text: `Generated SQL Query: ${sqlQuery}`, sender: 'ai' };
        setMessages(prevMessages => [...prevMessages, aiMessage]);

        const queryResult = executeSQLQuery(sqlQuery);
        if (typeof queryResult === 'string' && queryResult.startsWith('Error:')) {
          const aiErrorMessage: Message = { id: messages.length + 3, text: queryResult, sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiErrorMessage]);
        } else if (queryResult) {
          const rawQueryResponse = JSON.stringify(queryResult);
          const aiMessageQueryResult: Message = { id: messages.length + 3, text: `Query Result: ${rawQueryResponse}`, sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiMessageQueryResult]);

          const friendlyResponse = await getFriendlyResponse(rawQueryResponse, input);
          const aiMessageFriendly: Message = { id: messages.length + 4, text: friendlyResponse, sender: 'ai' };
          setMessages(prevMessages => [...prevMessages, aiMessageFriendly]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-w-6xl mx-auto p-4 gap-4">
      <Card className="flex flex-col h-full w-full md:w-1/2">
        <CardHeader className="bg-blue-600 text-primary-foreground">
          <CardTitle>AI SQL Generator</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col h-full min-h-0 p-4">
          <div className="flex flex-col flex-grow min-h-0">
            <ScrollArea className="flex-grow overflow-auto mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-2 flex-shrink-0">
              <div className="mb-4">
                <Select onValueChange={(value) => setSelectedStrategy(value)} defaultValue="zero-shot">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zero-shot">Zero-Shot</SelectItem>
                    <SelectItem value="single-domain">Single-Domain</SelectItem>
                    <SelectItem value="cross-domain">Cross-Domain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSend} className="flex gap-2 w-full">
                <Input
                  type="text"
                  placeholder="Ask about your calendar events..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-blue-600 text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full md:w-1/2 flex flex-col h-full gap-4">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Database Illustration</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <Skeleton className="h-48 w-48 " />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Info, Paperclip, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import type { ChatMessageWithUser, MeetupWithParticipants } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute('/chat/:id');
  const meetupId = parseInt(params?.id || '0');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: meetup } = useQuery({
    queryKey: ['/api/meetups', meetupId],
    queryFn: async () => {
      const response = await fetch(`/api/meetups/${meetupId}`);
      if (!response.ok) throw new Error('Failed to fetch meetup');
      return response.json() as Promise<MeetupWithParticipants>;
    },
    enabled: !!meetupId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/meetups', meetupId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/meetups/${meetupId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json() as Promise<ChatMessageWithUser[]>;
    },
    enabled: !!meetupId,
  });

  // WebSocket setup
  useEffect(() => {
    if (!meetupId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join_room',
        meetupId,
      }));
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message' || data.type === 'message_sent') {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/meetups', meetupId, 'messages'] 
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [meetupId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket || !user) return;

    socket.send(JSON.stringify({
      type: 'chat_message',
      meetupId,
      userId: user.id,
      message: message.trim(),
    }));

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return firstName?.[0] || lastName?.[0] || '?';
  };

  if (!meetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Chat Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{meetup.title}</h2>
            <p className="text-sm text-gray-600">
              {meetup.participants.length} participants • {meetup.scheduledDate || 'Date TBD'}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
            <Info className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </header>

      {/* Participants Bar */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          {meetup.participants.map((participant) => (
            <div key={participant.user.id} className="flex items-center space-x-1">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {getInitials(participant.user.firstName, participant.user.lastName)}
                </span>
              </div>
              <span className="text-xs text-gray-600">{participant.user.firstName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500 text-center">
              No messages yet. Be the first to say hello! 👋
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user.id === user?.id;
            const initials = getInitials(msg.user.firstName, msg.user.lastName);

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {!isOwnMessage && (
                  <div className="w-8 h-8 bg-gradient-to-r from-secondary to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">{initials}</span>
                  </div>
                )}
                
                <div className={`flex-1 max-w-xs ${isOwnMessage ? 'text-right' : ''}`}>
                  {!isOwnMessage && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{msg.user.firstName}</span>
                      <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl p-3 ${
                      isOwnMessage
                        ? 'gradient-primary text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-tl-md'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  
                  {isOwnMessage && (
                    <div className="text-xs text-gray-500 mt-1">{formatTime(msg.createdAt)}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-100 rounded-full focus:ring-2 focus:ring-primary focus:bg-white border-0"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-primary"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || !socket}
            className="p-3 gradient-primary text-white rounded-full hover:shadow-lg transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

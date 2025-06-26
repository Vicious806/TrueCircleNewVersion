import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Send, Info, Paperclip, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import ChatPinnedHeader from "@/components/ChatPinnedHeader";
import type { ChatMessageWithUser, MeetupWithParticipants } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute('/chat/:id');
  const matchId = parseInt(params?.id || '0');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: match } = useQuery({
    queryKey: ['/api/matches', matchId],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      return response.json();
    },
    enabled: !!matchId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/matches', matchId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json() as Promise<ChatMessageWithUser[]>;
    },
    enabled: !!matchId,
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

      {/* Pinned Meetup Details Header */}
      <ChatPinnedHeader
        venueType="restaurant"
        meetupType="group"
        participantCount={3}
      />

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
          messages.map((msg, index) => {
            const initials = getInitials(msg.user.firstName, msg.user.lastName);
            const showDateSeparator = index === 0 || 
              new Date(msg.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

            return (
              <div key={msg.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {/* Discord-style Message */}
                <div className="group flex items-start space-x-3 px-4 py-1 hover:bg-gray-50 rounded">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={msg.user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {/* Username with Profile Popup */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-semibold text-gray-900 hover:underline text-sm cursor-pointer">
                            {msg.user.firstName} {msg.user.lastName}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" side="right" align="start">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-16 rounded-t-lg"></div>
                          <div className="p-4 -mt-8">
                            <div className="flex items-start space-x-3">
                              <Avatar className="w-16 h-16 border-4 border-white">
                                <AvatarImage src={msg.user.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-semibold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 pt-2">
                                <h3 className="font-bold text-lg text-gray-900">
                                  {msg.user.firstName} {msg.user.lastName}
                                </h3>
                                <p className="text-gray-600 text-sm">@{msg.user.username}</p>
                              </div>
                            </div>
                            
                            {msg.user.bio && (
                              <div className="mt-3">
                                <h4 className="font-semibold text-sm text-gray-700 mb-1">About</h4>
                                <p className="text-gray-600 text-sm">{msg.user.bio}</p>
                              </div>
                            )}
                            
                            <div className="mt-3">
                              <h4 className="font-semibold text-sm text-gray-700 mb-1">Location</h4>
                              <p className="text-gray-600 text-sm">{msg.user.location || 'Not specified'}</p>
                            </div>
                            
                            <div className="mt-3">
                              <h4 className="font-semibold text-sm text-gray-700 mb-1">Joined</h4>
                              <p className="text-gray-600 text-sm">
                                {new Date(msg.user.createdAt).toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Timestamp */}
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>

                    {/* Message Text */}
                    <div className="mt-1">
                      <p className="text-gray-900 text-sm leading-relaxed break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
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

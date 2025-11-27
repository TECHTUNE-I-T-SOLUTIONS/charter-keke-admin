"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { useEffect } from "react"
// Mobile detection hook
function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false)
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768)
		checkMobile()
		window.addEventListener("resize", checkMobile)
		return () => window.removeEventListener("resize", checkMobile)
	}, [])
	return isMobile
}
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Send, User, X, MessageCircle } from "lucide-react"

// Types
type User = {
	id: number;
	name: string;
	email: string;
	avatar: string;
};
type Message = {
	from: string;
	text: string;
	time: string;
};
type Conversations = {
	[userId: number]: Message[];
};

// Mock users and messages
const mockUsers: User[] = [
	{ id: 1, name: "Jane Doe", email: "jane@easely.com", avatar: "https://img.icons8.com/?size=100&id=23259&format=png&color=000000" },
	{ id: 2, name: "John Smith", email: "john@easely.com", avatar: "https://img.icons8.com/?size=100&id=9ZAO_U356VVd&format=png&color=000000" },
	{ id: 3, name: "Mary Lee", email: "mary@easely.com", avatar: "https://img.icons8.com/?size=100&id=108321&format=png&color=000000" },
];
const mockConversations: Conversations = {
	1: [
		{ from: "admin", text: "Hi Jane, welcome to EASELY!", time: "09:00" },
		{ from: "Jane Doe", text: "Thank you! Excited to use the platform.", time: "09:01" },
	],
	2: [
		{ from: "admin", text: "Hello John, system maintenance is scheduled for tonight.", time: "08:00" },
		{ from: "John Smith", text: "Thanks for the update.", time: "08:02" },
	],
	3: [
		{ from: "admin", text: "Hi Mary, let us know if you need help.", time: "10:00" },
		{ from: "Mary Lee", text: "Will do, thanks!", time: "10:01" },
	],
};

function AdminMessagesContent() {
	const isMobile = useIsMobile()
	const [modalOpen, setModalOpen] = useState(false)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [message, setMessage] = useState("")
	const [conversations, setConversations] = useState<Conversations>(mockConversations)

	const handleUserSelect = (user: User) => {
		setSelectedUser(user)
		setModalOpen(false)
	}

	const handleSend = () => {
		if (!selectedUser || !message.trim()) return
		setConversations((prev) => ({
			...prev,
			[selectedUser.id]: [
				...(prev[selectedUser.id] || []),
				{ from: "admin", text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
			],
		}))
		setMessage("")
		toast.success("Message sent!")
	}

	return (
		<div className="flex min-h-screen bg-background">
			<DashboardSidebar />
			<main className="flex-1 pt-16 lg:pt-0 flex flex-col">
				<div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6 h-full">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Admin Messages</h1>
								<p className="text-muted-foreground mt-1">Manage conversations and send messages to users</p>
							</div>
							<Dialog open={modalOpen} onOpenChange={setModalOpen}>
								<DialogTrigger asChild>
									<Button variant="outline" className="flex gap-2"><User className="h-5 w-5" />Message User</Button>
								</DialogTrigger>
								<DialogPortal>
									<DialogOverlay className="bg-black/40 fixed inset-0 z-50" />
									<DialogContent className="max-w-md w-full bg-background rounded-lg shadow-lg p-6 z-50">
										<DialogTitle>Select User</DialogTitle>
										<div className="flex items-center justify-between mb-4">
											<span />
											<DialogClose asChild>
												<Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
											</DialogClose>
										</div>
										<ScrollArea className="max-h-64">
											{mockUsers.map(user => (
												<div key={user.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-primary/5 rounded" onClick={() => handleUserSelect(user)}>
													<Avatar className="h-8 w-8">
														<AvatarImage src={user.avatar} alt={user.name} />
														<AvatarFallback>{user.name[0]}</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium">{user.name}</div>
														<div className="text-xs text-muted-foreground">{user.email}</div>
													</div>
												</div>
											))}
										</ScrollArea>
									</DialogContent>
								</DialogPortal>
							</Dialog>
						</div>
					</motion.div>
					<Separator />
					{/* Responsive layout: desktop/tablet vs mobile */}
					{isMobile ? (
						<div className="flex-1 flex flex-col bg-card/50 rounded-lg border border-primary/10 p-0">
							{!selectedUser ? (
								<div className="p-4">
									<h3 className="font-semibold mb-2 text-lg">Users</h3>
									<ScrollArea className="max-h-96">
										{mockUsers.map(user => (
											  <div key={user.id} className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-primary/5 ${((selectedUser as User | null)?.id === user.id) ? 'bg-primary/10' : ''}`} onClick={() => setSelectedUser(user)}>
												<Avatar className="h-7 w-7">
													<AvatarImage src={user.avatar} alt={user.name} />
													<AvatarFallback>{user.name[0]}</AvatarFallback>
												</Avatar>
												<div>
													<div className="font-medium text-sm">{user.name}</div>
													<div className="text-xs text-muted-foreground">{user.email}</div>
												</div>
											</div>
										))}
									</ScrollArea>
								</div>
							) : (
								<div className="flex flex-col h-full">
									<div className="flex items-center gap-3 p-4 border-b border-primary/10 bg-background">
										<Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
											<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 18l-6-6 6-6" /></svg>
										</Button>
										<Avatar className="h-8 w-8">
											<AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
											<AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
										</Avatar>
										<div>
											<div className="font-semibold">{selectedUser.name}</div>
											<div className="text-xs text-muted-foreground">{selectedUser.email}</div>
										</div>
									</div>
									<ScrollArea className="flex-1 min-h-[200px] max-h-[350px] my-4 pr-2">
										<div className="flex flex-col gap-3 px-4">
											{(conversations[selectedUser.id] || []).map((msg: Message, idx: number) => (
												<div key={idx} className={`flex ${msg.from === "admin" ? 'justify-end' : 'justify-start'}`}> 
													<div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${msg.from === "admin" ? 'bg-primary text-white' : 'bg-background border'}`}>
														{msg.text}
														<span className="block text-xs text-muted-foreground mt-1 text-right">{msg.time}</span>
													</div>
												</div>
											))}
										</div>
									</ScrollArea>
									<form className="flex gap-2 p-4 border-t border-primary/10" onSubmit={e => { e.preventDefault(); handleSend(); }}>
										<Textarea
											placeholder="Type your message..."
											value={message}
											onChange={e => setMessage(e.target.value)}
											className="resize-none min-h-[40px]"
										/>
										<Button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={!message.trim()}>
											<Send className="h-5 w-5" />
										</Button>
									</form>
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-1 flex-col md:flex-row gap-6 h-full">
							{/* User List (Sidebar) */}
							<div className="w-full md:w-64 bg-card/50 rounded-lg border border-primary/10 p-4 flex-shrink-0">
								<h3 className="font-semibold mb-2 text-lg">Users</h3>
								<ScrollArea className="max-h-96">
									{mockUsers.map(user => (
										<div key={user.id} className={`flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-primary/5 ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`} onClick={() => setSelectedUser(user)}>
											<Avatar className="h-7 w-7">
												<AvatarImage src={user.avatar} alt={user.name} />
												<AvatarFallback>{user.name[0]}</AvatarFallback>
											</Avatar>
											<div>
												<div className="font-medium text-sm">{user.name}</div>
												<div className="text-xs text-muted-foreground">{user.email}</div>
											</div>
										</div>
									))}
								</ScrollArea>
							</div>
							{/* Conversation UI */}
							<div className="flex-1 flex flex-col bg-card/50 rounded-lg border border-primary/10 p-4">
								{selectedUser ? (
									<>
										<div className="flex items-center gap-3 mb-4">
											<Avatar className="h-9 w-9">
												<AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
												<AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
											</Avatar>
											<div>
												<div className="font-semibold">{selectedUser.name}</div>
												<div className="text-xs text-muted-foreground">{selectedUser.email}</div>
											</div>
										</div>
										<Separator />
										<ScrollArea className="flex-1 min-h-[200px] max-h-[350px] my-4 pr-2">
											<div className="flex flex-col gap-3">
												{(conversations[selectedUser.id] || []).map((msg: Message, idx: number) => (
													<div key={idx} className={`flex ${msg.from === "admin" ? 'justify-end' : 'justify-start'}`}> 
														<div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${msg.from === "admin" ? 'bg-primary text-white' : 'bg-background border'}`}>
															{msg.text}
															<span className="block text-xs text-muted-foreground mt-1 text-right">{msg.time}</span>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
										<form className="flex gap-2 mt-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
											<Textarea
												placeholder="Type your message..."
												value={message}
												onChange={e => setMessage(e.target.value)}
												className="resize-none min-h-[40px]"
											/>
											<Button type="submit" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={!message.trim()}>
												<Send className="h-5 w-5" />
											</Button>
										</form>
									</>
								) : (
									<div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
										<MessageCircle className="h-12 w-12 mb-2 text-primary/40" />
										<p className="font-medium">Select a user to start a conversation</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}

export default function AdminMessagesPage() {
	return (
		<ProtectedRoute allowedRoles={["admin"]}>
			<AdminMessagesContent />
		</ProtectedRoute>
	)
}

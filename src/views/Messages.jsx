import { useState } from "react";
import Card from "../components/UI/Card";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import GhostButton from "../components/UI/GhostButton";
import gigs from "./gigs-data";
import { Paperclip, Send } from "lucide-react";

export default function Messages({ messages, onSendMessage }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">

        {/* LEFT SIDEBAR */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Inbox</h3>
          {gigs.slice(0, 4).map((g) => (
            <Card key={g.id} className="p-3 hover:bg-neutral-50 cursor-pointer">
              <div className="font-medium">{g.provider}</div>
              <div className="text-xs text-neutral-500">{g.title}</div>
            </Card>
          ))}
        </Card>

        {/* RIGHT CHAT PANEL */}
        <Card className="grid grid-rows-[auto_1fr_auto]">

          {/* CHAT HEADER */}
          <div className="border-b p-4 flex justify-between">
            <div>
              <div className="font-semibold">
                Alex P. <span className="text-green-600 text-xs ml-2">● online</span>
              </div>
              <div className="text-xs text-neutral-500">Job: Install faucet • #12345</div>
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div className="p-4 space-y-3 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`px-3 py-2 rounded-2xl text-sm w-fit max-w-[70%] ${
                  m.from === "me"
                    ? "ml-auto bg-black text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* CHAT INPUT */}
          <div className="p-3 border-t flex items-center gap-2">
            <GhostButton>
              <Paperclip className="h-4 w-4" />
            </GhostButton>

            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
            />

            <Button disabled={!text.trim()} onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

        </Card>
      </div>
    </div>
  );
}

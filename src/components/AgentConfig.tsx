import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export interface Agent {
  id: string;
  name: string;
  agentId: string;
  bio: string;
  llm?: string;
}

const agentSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Agent name is required")
    .max(100, "Agent name must be less than 100 characters"),
  agentId: z.string()
    .trim()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Agent ID can only contain letters, numbers, hyphens, and underscores"
    )
    .min(3, "Agent ID must be at least 3 characters")
    .max(100, "Agent ID must be less than 100 characters"),
  bio: z.string()
    .trim()
    .max(1000, "Bio must be less than 1000 characters")
    .optional(),
  llm: z.string()
    .trim()
    .max(100, "LLM model name must be less than 100 characters")
    .optional()
});

interface AgentConfigProps {
  agents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  onClose: () => void;
  onRefresh: () => void;
}

const AgentConfig = ({ agents, onAgentsChange, onClose, onRefresh }: AgentConfigProps) => {
  const { toast } = useToast();
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentBio, setNewAgentBio] = useState("");
  const [newAgentLlm, setNewAgentLlm] = useState("");
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const addOrUpdateAgent = async () => {
    // Validate input
    const validationResult = agentSchema.safeParse({
      name: newAgentName,
      agentId: newAgentId,
      bio: newAgentBio || undefined,
      llm: newAgentLlm || undefined
    });

    if (!validationResult.success) {
      toast({
        title: "Invalid Input",
        description: validationResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validationResult.data;

    if (editingAgentId) {
      // Update existing agent in database
      const { error } = await supabase
        .from('agents')
        .update({
          name: validatedData.name,
          agent_id: validatedData.agentId,
          bio: validatedData.bio || null,
          llm: validatedData.llm || null,
        })
        .eq('id', editingAgentId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agent Updated",
        description: `${validatedData.name} has been updated successfully`,
      });
    } else {
      // Add new agent to database
      const { error } = await supabase
        .from('agents')
        .insert({
          name: validatedData.name,
          agent_id: validatedData.agentId,
          bio: validatedData.bio || null,
          llm: validatedData.llm || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agent Added",
        description: `${validatedData.name} has been added successfully`,
      });
    }

    setNewAgentName("");
    setNewAgentId("");
    setNewAgentBio("");
    setNewAgentLlm("");
    setEditingAgentId(null);
    
    // Refresh the agents list
    onRefresh();
  };

  const editAgent = (agent: Agent) => {
    setNewAgentName(agent.name);
    setNewAgentId(agent.agentId);
    setNewAgentBio(agent.bio);
    setNewAgentLlm(agent.llm || "");
    setEditingAgentId(agent.id);
  };

  const cancelEdit = () => {
    setNewAgentName("");
    setNewAgentId("");
    setNewAgentBio("");
    setNewAgentLlm("");
    setEditingAgentId(null);
  };

  const removeAgent = async (id: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Agent Removed",
      description: "Agent has been removed from the list",
    });
    
    // Refresh the agents list
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-glow border-border">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-2xl">Agent Configuration</CardTitle>
          <CardDescription>
            Add and manage your ElevenLabs agents
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[calc(90vh-220px)] px-6">
            <div className="space-y-6 py-6 pr-4">
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName" className="text-card-foreground">Agent Name</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Customer Support Agent"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="border-input bg-white text-gray-900 placeholder:text-gray-500"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentId" className="text-card-foreground">ElevenLabs Agent ID</Label>
                <Input
                  id="agentId"
                  placeholder="e.g., agent_3701k83..."
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  className="border-input bg-white text-gray-900 placeholder:text-gray-500"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentBio" className="text-card-foreground">Agent Bio</Label>
                <Textarea
                  id="agentBio"
                  placeholder="Brief description of the agent..."
                  value={newAgentBio}
                  onChange={(e) => setNewAgentBio(e.target.value)}
                  className="border-input bg-white text-gray-900 placeholder:text-gray-500 min-h-[100px]"
                  maxLength={1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentLlm" className="text-card-foreground">LLM Model</Label>
                <Input
                  id="agentLlm"
                  placeholder="e.g., GPT-4, Claude 3.5, Gemini Pro"
                  value={newAgentLlm}
                  onChange={(e) => setNewAgentLlm(e.target.value)}
                  className="border-input bg-white text-gray-900 placeholder:text-gray-500"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addOrUpdateAgent}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                {editingAgentId ? "Update Agent" : "Add Agent"}
              </Button>
              {editingAgentId && (
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  className="px-4"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Configured Agents</h3>
            {agents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No agents configured yet
              </p>
            ) : (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-card-foreground">{agent.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {agent.agentId}
                      </p>
                      {agent.bio && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {agent.bio}
                        </p>
                      )}
                      {agent.llm && (
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                          LLM: {agent.llm}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => editAgent(agent)}
                        variant="ghost"
                        size="icon"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => removeAgent(agent.id)}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

            </div>
          </ScrollArea>
        </CardContent>
        <div className="flex-shrink-0 p-6 pt-0">
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AgentConfig;

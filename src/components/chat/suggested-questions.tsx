import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import type { SuggestedQuestion } from "@/types/chat";

type SuggestedQuestionsProps = {
  questions: SuggestedQuestion[];
  onQuestionClick: (question: string) => void;
};

export const SuggestedQuestions = memo(function SuggestedQuestions({
  questions,
  onQuestionClick,
}: SuggestedQuestionsProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground font-semibold">
        Preguntas sugeridas:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {questions.map((item) => (
          <button
            key={item.id}
            onClick={() => onQuestionClick(item.question)}
            className="
              text-left p-4 rounded-xl border border-border
              hover:border-primary hover:bg-primary/5 hover:shadow-sm
              transition-all duration-200
              group
            "
          >
            <Badge variant="secondary" className="mb-2 text-xs">
              {item.category}
            </Badge>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-relaxed">
              {item.question}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
});

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface ReviewItem {
  id: number;
  question: string;
  answer: string | null;
  status: string;
  confidence: number | null;
  citations: CitationItem[];
}

interface CitationItem {
  embeddingId: number;
  score: number;
  snippet: string;
  source: string;
}

interface ReviewInterfaceProps {
  items: ReviewItem[];
  projectId: number;
  onStatusUpdate: (itemId: number, status: string, editedAnswer?: string) => void;
  isLoading?: boolean;
}

export function ReviewInterface({
  items,
  onStatusUpdate,
  isLoading = false,
}: ReviewInterfaceProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<number, string>>({});

  const needsReviewItems = items.filter((item) => item.status === 'NEEDS_REVIEW');
  const draftedItems = items.filter((item) => item.status === 'DRAFTED');
  const approvedItems = items.filter((item) => item.status === 'APPROVED');

  const handleApprove = (item: ReviewItem) => {
    onStatusUpdate(item.id, 'APPROVED');
  };

  const handleReject = (item: ReviewItem) => {
    onStatusUpdate(item.id, 'REJECTED');
  };

  const handleEdit = (item: ReviewItem) => {
    const editedAnswer = editedAnswers[item.id] || item.answer || '';
    onStatusUpdate(item.id, 'APPROVED', editedAnswer);
    setEditingId(null);
  };

  const renderItem = (item: ReviewItem, showEdit = false) => (
    <Card key={item.id} className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{item.question}</CardTitle>
        <div className="flex gap-2 mt-2">
          <span className={`px-2 py-1 rounded text-sm font-semibold ${
            item.status === 'NEEDS_REVIEW' ? 'bg-red-100 text-red-800' :
            item.status === 'DRAFTED' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {item.status}
          </span>
          {item.confidence && (
            <span className="text-sm text-gray-600">
              Confidence: {(item.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingId === item.id && showEdit ? (
          <div className="space-y-2">
            <Textarea
              value={editedAnswers[item.id] || item.answer || ''}
              onChange={(e) => setEditedAnswers({
                ...editedAnswers,
                [item.id]: e.target.value,
              })}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleEdit(item)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Edit
              </Button>
              <Button
                onClick={() => setEditingId(null)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-800 mb-4">{item.answer || 'No answer generated'}</p>
            {!!item.citations?.length && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">Sources:</p>
                <div className="space-y-2">
                  {item.citations.map((citation) => (
                    <div key={`${item.id}-${citation.embeddingId}`} className="rounded border bg-white p-2">
                      <p className="text-xs font-medium text-gray-700">
                        {citation.source} | Score {(citation.score * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap">{citation.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {item.confidence !== null && item.confidence < 0.65 && (
              <p className="mb-4 rounded border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700">
                Low confidence: mandatory human review required before export.
              </p>
            )}
            {showEdit && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(item)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  ✓ Approve
                </Button>
                <Button
                  onClick={() => setEditingId(item.id)}
                  variant="outline"
                  disabled={isLoading}
                >
                  ✎ Edit & Approve
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isLoading}
                    >
                      ✗ Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Reject Answer</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this answer? It will need to be reviewed again.
                    </AlertDialogDescription>
                    <AlertDialogAction onClick={() => handleReject(item)}>
                      Reject
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {needsReviewItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Needs Review ({needsReviewItems.length})
          </h2>
          {needsReviewItems.map((item) => renderItem(item, true))}
        </div>
      )}

      {draftedItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-yellow-600">
            Drafted ({draftedItems.length})
          </h2>
          {draftedItems.map((item) => renderItem(item, true))}
        </div>
      )}

      {approvedItems.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-green-600">
            Approved ({approvedItems.length})
          </h2>
          {approvedItems.map((item) => renderItem(item, false))}
        </div>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">No items to review</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

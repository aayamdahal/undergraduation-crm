"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Student } from "@/data/students";
import { buildStudentSummaryPayload } from "@/lib/studentSummary";
import type {
  StudentSummaryRequestBody,
  StudentSummaryResponse,
} from "@/types/studentSummary";

export type UseStudentSummaryResult = {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

export const useStudentSummary = (
  student: Student | null
): UseStudentSummaryResult => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const summarySource = useMemo(() => {
    if (!student) {
      return null;
    }

    const payload = buildStudentSummaryPayload(student);
    const signature = JSON.stringify(payload);

    return { payload, signature };
  }, [student]);

  const lastSignatureRef = useRef<string | null>(null);
  const lastStudentIdRef = useRef<string | null>(null);
  const refreshMarkerRef = useRef(0);

  const refresh = useCallback(() => {
    setRefreshCounter((value) => value + 1);
  }, []);

  // useEffect(() => {
  //   if (!summarySource) {
  //     setSummary(null);
  //     setError(null);
  //     setIsLoading(false);
  //     lastSignatureRef.current = null;
  //     lastStudentIdRef.current = null;
  //     refreshMarkerRef.current = 0;
  //     return;
  //   }

  //   const { payload, signature } = summarySource;
  //   const studentId = payload.id;

  //   const hasNewStudent = lastStudentIdRef.current !== studentId;
  //   const hasDifferentSignature = lastSignatureRef.current !== signature;
  //   const hasRefreshRequest = refreshMarkerRef.current !== refreshCounter;

  //   if (!hasNewStudent && !hasDifferentSignature && !hasRefreshRequest) {
  //     return;
  //   }

  //   lastSignatureRef.current = signature;
  //   lastStudentIdRef.current = studentId;
  //   refreshMarkerRef.current = refreshCounter;

  //   const controller = new AbortController();
  //   let isCancelled = false;

  //   const fetchSummary = async () => {
  //     setIsLoading(true);
  //     setError(null);
  //     if (hasNewStudent) {
  //       setSummary(null);
  //     }

  //     try {
  //       const response = await fetch(
  //         `/api/students/${encodeURIComponent(studentId)}/summary`,
  //         {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({
  //             student: payload,
  //           } satisfies StudentSummaryRequestBody),
  //           signal: controller.signal,
  //           cache: "no-store",
  //         }
  //       );

  //       if (!response.ok) {
  //         const data = (await response.json().catch(() => null)) as {
  //           error?: string;
  //         } | null;
  //         const message =
  //           (data && typeof data?.error === "string" && data.error) ||
  //           `Unable to generate AI summary (status ${response.status}).`;
  //         throw new Error(message);
  //       }

  //       const data = (await response.json()) as StudentSummaryResponse;
  //       const text =
  //         typeof data.summary === "string" ? data.summary.trim() : "";

  //       if (!isCancelled) {
  //         setSummary(text.length > 0 ? text : null);
  //         setError(null);
  //       }
  //     } catch (err) {
  //       if (isCancelled || controller.signal.aborted) {
  //         return;
  //       }

  //       const message =
  //         err instanceof Error
  //           ? err.message
  //           : "Unable to generate AI summary right now.";
  //       setError(message);
  //       setSummary(null);
  //     } finally {
  //       if (!isCancelled) {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   void fetchSummary();

  //   return () => {
  //     isCancelled = true;
  //     controller.abort();
  //   };
  // }, [summarySource, refreshCounter]);

  return useMemo(
    () => ({ summary, isLoading, error, refresh }),
    [summary, isLoading, error, refresh]
  );
};

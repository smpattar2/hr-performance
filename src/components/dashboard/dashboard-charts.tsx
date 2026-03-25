"use client";

import {
  DepartmentOkrChart,
  OkrStatusPieChart,
  ReviewCompletionChart,
  RatingDistributionChart,
} from "./charts";

interface DashboardChartsProps {
  deptOkrData: { department: string; progress: number; count: number }[];
  okrStatusData: { name: string; value: number; color: string }[];
  reviewStatusData: { name: string; value: number; fill: string }[];
  ratingDistData: { rating: string; count: number }[];
}

export function DashboardCharts({
  deptOkrData,
  okrStatusData,
  reviewStatusData,
  ratingDistData,
}: DashboardChartsProps) {
  const hasOkrData = deptOkrData.length > 0 || okrStatusData.some((d) => d.value > 0);
  const hasReviewData = reviewStatusData.some((d) => d.value > 0) || ratingDistData.some((d) => d.count > 0);

  if (!hasOkrData && !hasReviewData) return null;

  return (
    <div className="space-y-6">
      {hasOkrData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {deptOkrData.length > 0 && <DepartmentOkrChart data={deptOkrData} />}
          {okrStatusData.some((d) => d.value > 0) && (
            <OkrStatusPieChart data={okrStatusData.filter((d) => d.value > 0)} />
          )}
        </div>
      )}
      {hasReviewData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviewStatusData.some((d) => d.value > 0) && (
            <ReviewCompletionChart data={reviewStatusData} />
          )}
          {ratingDistData.some((d) => d.count > 0) && (
            <RatingDistributionChart data={ratingDistData} />
          )}
        </div>
      )}
    </div>
  );
}

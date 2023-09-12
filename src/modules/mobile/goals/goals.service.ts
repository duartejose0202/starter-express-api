import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { GoalEntryDocument } from './goal-entry.document';
import { GoalDocument } from './goal.document';
import { ChartDataDocument, ChartItemDocument } from "./chart-data.document";

@Injectable()
export class GoalsService extends FirestoreBaseService {
  async getGoalEntries(appId: string, userId: string) {
    const allGoalEntries = [];

    const goalResponse = await this.getUserCollection<GoalDocument>(
      appId,
      userId,
      GoalDocument.collectionName,
    ).get();
    for (const goal of goalResponse.docs) {
      const entryResponse = await goal.ref
        .collection(GoalEntryDocument.collectionName)
        .get();
      const entries = entryResponse.docs.map((doc) => {
        const entry = doc.to(GoalEntryDocument);
        entry.goalId = goal.id;
        return entry;
      });
      allGoalEntries.push(...entries);
    }

    return allGoalEntries;
  }

  async getGoals(appId: string, userId: string) {
    const customGoalResponse = await this.getUserCollection<GoalDocument>(
      appId,
      userId,
      'customGoals',
    ).get();
    const userGoals = customGoalResponse.docs.map((doc) =>
      doc.to(GoalDocument),
    );

    const goalResponse = await this.getCollection<GoalDocument>(
      appId,
      GoalDocument.collectionName,
    ).get();
    const goals = goalResponse.docs.map((doc) => {
      const goal = doc.to(GoalDocument);
      goal.global = true;
      return goal;
    });

    return [...userGoals, ...goals];
  }

  async updateGoal(appId: string, userId: string, goal: GoalDocument) {
    await this.getUserCollection<GoalDocument>(
      appId,
      userId,
      'customGoals'
    ).doc(goal.id).set(goal, { merge: true });

    return goal;
  }

  async updateGlobalGoal(appId: string, userId: string, goal: GoalDocument) {
    await this.getCollection<GoalDocument>(
      appId,
      GoalDocument.collectionName
    ).doc(goal.id).set(goal, { merge: true });

    return goal;
  }

  async addGoal(appId: string, userId: string, goal: GoalDocument) {
    const result = await this.getUserCollection<GoalDocument>(
      appId,
      userId,
      'customGoals'
    ).add(goal);

    goal.id = result.id;
    goal.path = result.path;

    return goal;
  }

  async deleteGoal(appId: string, userId: string, goalId: string) {
    await this.getUserCollection<GoalDocument>(
      appId,
      userId,
      'customGoals'
    ).doc(goalId).delete();
  }

  async deleteGlobalGoal(appId: string, goalId: string) {
    await this.getCollection<GoalDocument>(
      appId,
      'goals'
    ).doc(goalId).delete();
  }

  async getCharts(appId: string, userId: string) {
    const result = await this.getUserCollection<ChartDataDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).get();

    const charts = [];
    for (let doc of result.docs) {
      const newChart = doc.to(ChartDataDocument);
      newChart.items = await this.getItemsForChart(appId, userId, newChart.id);
      charts.push(newChart);
    }

    return charts;
  }

  async getItemsForChart(appId: string, userId: string, chartId: string): Promise<ChartItemDocument[]> {
    const response = await this.getUserCollection<ChartItemDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).doc(chartId).collection('items').get();
    return response.docs.map((doc) => doc.to(ChartItemDocument));
  }

  async addItemToChart(appId: string, userId: string, chartId: string, item: ChartItemDocument) {
    const result = await this.getUserCollection<ChartItemDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).doc(chartId).collection('items').add(item);

    item.id = result.id;
    item.path = result.path;

    return item;
  }

  async deleteItemFromChart(appId: string, userId: string, chartId: string, itemId: string) {
    await this.getUserCollection<ChartItemDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).doc(chartId).collection('items').doc(itemId).delete();
  }

  async addChart(appId: string, userId: string, chart: ChartDataDocument) {
    const result = await this.getUserCollection<ChartDataDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).add(chart);

    chart.id = result.id;
    chart.path = result.path;

    return chart;
  }

  async updateChart(appId: string, userId: string, chartId: string, chart: ChartDataDocument) {
    if (chart.id !== chartId) {
      throw new Error('Chart ID does not match');
    }

    await this.getUserCollection<ChartDataDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).doc(chartId).set(chart, { merge: true });

    return chart;
  }

  async deleteChart(appId: string, userId: string, chartId: string) {
    await this.getUserCollection<ChartDataDocument>(
      appId,
      userId,
      ChartDataDocument.collectionName
    ).doc(chartId).delete();
  }

  async reorderCharts(appId: string, userId: string, ids: string[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.getUserCollection<ChartDataDocument>(
        appId,
        userId,
        ChartDataDocument.collectionName
      ).doc(ids[i]).set({ order: i }, { merge: true });
    }
  }

  async addGoalEntry(appId: string, userId: string, goalId: string, entry: GoalEntryDocument) {
    const goalResult = await this.getUserCollection(
      appId,
      userId,
      GoalDocument.collectionName
    ).doc(goalId).get();

    if (!goalResult.exists) {
      await goalResult.ref.set({});
    }

    const result = await goalResult
      .ref
      .collection(GoalEntryDocument.collectionName)
      .add(entry);

    entry.id = result.id;
    entry.path = result.path;

    return entry;
  }

  async updateGoalEntry(appId: string, userId: string, goalId: string, entryId: string, entry: GoalEntryDocument) {
    if (entry.id !== entryId) {
      throw new Error('Entry ID does not match');
    }

    await this.getUserCollection<GoalEntryDocument>(
      appId,
      userId,
      GoalDocument.collectionName
    ).doc(goalId).collection(GoalEntryDocument.collectionName).doc(entryId).set(entry, { merge: true });

    return entry;
  }
}

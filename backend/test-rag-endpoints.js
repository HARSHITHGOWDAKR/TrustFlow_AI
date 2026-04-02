const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 36; // Using existing project

async function handleError(response, label) {
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`❌ ${label} failed with status ${response.status}:`, errorData);
    return null;
  }
  return response.json();
}

async function testRAGEndpoints() {
  console.log('🚀 Testing RAG Endpoints\n');
  console.log('═'.repeat(60));

  // TEST 1: Process a question through RAG pipeline
  console.log('\n📊 TEST 1: Process Question Through RAG Pipeline');
  console.log('-'.repeat(60));
  try {
    const processRes = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/process-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: 1,
        question: 'What are the security policies for access control?',
      }),
    });

    const processData = await handleError(processRes, 'Process Question');
    if (processData) {
      console.log('✅ Question processed successfully');
      console.log(`   • Confidence Score: ${(processData.data.confidenceScore * 100).toFixed(1)}%`);
      console.log(`   • Retrieved Chunks: ${processData.data.retrievedChunks.length}`);
      console.log(`   • Processing Time: ${processData.data.totalProcessingTime}ms`);
      console.log(`   • Processing Steps: ${processData.data.processingSteps.length}`);
      
      // Show retrieved chunks
      console.log('\n   📦 Retrieved Chunks:');
      processData.data.retrievedChunks.slice(0, 3).forEach((chunk, idx) => {
        console.log(`      ${idx + 1}. ${chunk.source} (Chunk ${chunk.chunkIndex})`);
        console.log(`         Similarity: ${(chunk.similarity * 100).toFixed(1)}%`);
        console.log(`         Preview: ${chunk.chunk.substring(0, 80)}...`);
      });

      // Show processing steps
      console.log('\n   ⚙️  Processing Steps:');
      processData.data.processingSteps.forEach((step) => {
        const status = step.status === 'completed' ? '✅' : '⏳';
        console.log(`      ${status} Step ${step.step}: ${step.name} (${step.duration}ms)`);
      });
    }
  } catch (error) {
    console.error('❌ Test 1 error:', error.message);
  }

  // TEST 2: Get RAG Statistics
  console.log('\n\n📈 TEST 2: Get RAG Statistics');
  console.log('-'.repeat(60));
  try {
    const statsRes = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/stats`);
    const statsData = await handleError(statsRes, 'Get Stats');
    
    if (statsData) {
      const stats = statsData.stats;
      console.log('✅ RAG Statistics retrieved');
      console.log(`   • Total Questions: ${stats.totalQuestions}`);
      console.log(`   • Questions Processed: ${stats.questionsProcessed}`);
      console.log(`   • Total Retrievals: ${stats.totalRetrievals}`);
      console.log(`   • Avg Chunks per Retrieval: ${stats.avgChunksPerRetrieval}`);
      console.log(`   • Avg Confidence Score: ${(stats.avgConfidenceScore * 100).toFixed(1)}%`);
      console.log(`   • Avg Similarity Score: ${(stats.avgSimilarityScore * 100).toFixed(1)}%`);
      console.log(`   • Top Similarity Threshold: ${(stats.topSimilarityThreshold * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.error('❌ Test 2 error:', error.message);
  }

  // TEST 3: Get Processing History
  console.log('\n\n📋 TEST 3: Get RAG Processing History');
  console.log('-'.repeat(60));
  try {
    const historyRes = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/history`);
    const historyData = await handleError(historyRes, 'Get History');
    
    if (historyData) {
      console.log(`✅ Processing history retrieved`);
      console.log(`   • Total Processed: ${historyData.totalProcessed}`);
      console.log(`   • Average Confidence: ${historyData.averageConfidence}%`);
      
      if (historyData.history.length > 0) {
        console.log('\n   Recent Questions:');
        historyData.history.slice(0, 3).forEach((q, idx) => {
          console.log(`      ${idx + 1}. ${q.question.substring(0, 60)}...`);
          console.log(`         Confidence: ${(q.confidenceScore * 100).toFixed(1)}% | Time: ${q.totalProcessingTime}ms`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Test 3 error:', error.message);
  }

  // TEST 4: Get Confidence Threshold Recommendations
  console.log('\n\n🎯 TEST 4: Get Confidence Threshold Recommendations');
  console.log('-'.repeat(60));
  try {
    const threshRes = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/confidence-threshold`);
    const threshData = await handleError(threshRes, 'Get Threshold');
    
    if (threshData) {
      console.log('✅ Confidence threshold analysis retrieved');
      const { high, medium, low } = threshData.confidenceDistribution;
      
      console.log('\n   📊 Confidence Distribution:');
      console.log(`      • High (80%+): ${high.count} results (${high.percentage}%)`);
      console.log(`        → ${high.recommendation}`);
      console.log(`      • Medium (60-80%): ${medium.count} results (${medium.percentage}%)`);
      console.log(`        → ${medium.recommendation}`);
      console.log(`      • Low (<60%): ${low.count} results (${low.percentage}%)`);
      console.log(`        → ${low.recommendation}`);
      
      console.log(`\n   💯 Overall Health Score: ${threshData.overallHealthScore}%`);
      
      console.log('\n   💡 Recommendations:');
      threshData.recommendations.forEach((rec) => {
        console.log(`      • ${rec}`);
      });
    }
  } catch (error) {
    console.error('❌ Test 4 error:', error.message);
  }

  // TEST 5: Get Complete RAG Summary
  console.log('\n\n🌟 TEST 5: Get Complete RAG Summary');
  console.log('-'.repeat(60));
  try {
    const summaryRes = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/summary`);
    const summaryData = await handleError(summaryRes, 'Get Summary');
    
    if (summaryData) {
      console.log('✅ RAG summary retrieved');
      
      console.log('\n   📊 Statistics:');
      const stats = summaryData.stats;
      console.log(`      • Questions: ${stats.questionsProcessed}/${stats.totalQuestions}`);
      console.log(`      • Avg Confidence: ${(stats.avgConfidenceScore * 100).toFixed(1)}%`);
      console.log(`      • Avg Similarity: ${(stats.avgSimilarityScore * 100).toFixed(1)}%`);
      
      console.log('\n   ⏱️  Processing Performance:');
      const hist = summaryData.processingHistory;
      console.log(`      • Avg Time: ${hist.averageProcessingTime}ms`);
      console.log(`      • Fastest: ${hist.fastestProcessing}ms`);
      console.log(`      • Slowest: ${hist.slowestProcessing}ms`);
      
      console.log(`\n   💯 Overall Health: ${summaryData.overallHealthScore}%`);
    }
  } catch (error) {
    console.error('❌ Test 5 error:', error.message);
  }

  // TEST 6: Get Question-Specific RAG Data
  console.log('\n\n🔍 TEST 6: Get Question-Specific RAG Data');
  console.log('-'.repeat(60));
  try {
    const qDataRes = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/question/1`);
    const qData = await handleError(qDataRes, 'Get Question Data');
    
    if (qData && qData.data) {
      console.log('✅ Question-specific RAG data retrieved');
      console.log(`   • Question: ${qData.data.question}`);
      console.log(`   • Confidence: ${(qData.data.confidenceScore * 100).toFixed(1)}%`);
      console.log(`   • Retrieved Chunks: ${qData.data.retrievedChunks.length}`);
      console.log(`   • Processing Time: ${qData.data.totalProcessingTime}ms`);
    } else if (qData) {
      console.log('⚠️  No data for question 1 (expected for first run)');
    }
  } catch (error) {
    console.error('❌ Test 6 error:', error.message);
  }

  // TEST 7: Process Multiple Questions (Simulating Real Workflow)
  console.log('\n\n🔄 TEST 7: Process Multiple Questions (Workflow Simulation)');
  console.log('-'.repeat(60));
  const questions = [
    'What are the data classification standards?',
    'How should incidents be reported?',
    'What is the backup and recovery procedure?',
    'Who has administrative access?',
    'What is the incident response timeline?',
  ];

  const results = [];
  for (let i = 0; i < questions.length; i++) {
    try {
      const res = await fetch(`${BASE_URL}/projects/${PROJECT_ID}/rag/process-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: i + 2,
          question: questions[i],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        results.push({
          question: questions[i],
          confidence: data.data.confidenceScore,
          chunks: data.data.retrievedChunks.length,
        });
        console.log(`   ✅ Q${i + 2}: ${(data.data.confidenceScore * 100).toFixed(0)}% confidence`);
      }
    } catch (error) {
      console.error(`   ❌ Q${i + 2} failed:`, error.message);
    }
  }

  // Summary of workflow
  if (results.length > 0) {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const highConfidenceCount = results.filter(r => r.confidence > 0.8).length;
    
    console.log('\n   📊 Workflow Summary:');
    console.log(`      • Total Questions: ${results.length}`);
    console.log(`      • Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`      • High Confidence: ${highConfidenceCount}/${results.length}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ RAG Endpoint Testing Complete\n');
}

// Run tests
testRAGEndpoints().catch(console.error);

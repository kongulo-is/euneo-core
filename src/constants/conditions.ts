import { TConditionId } from "../types/baseTypes";

type Conditions = Record<TConditionId, string>;

export const conditions: Conditions = {
  "achilles-rupture": "Achilles rupture",
  "achilles-tendinopathy": "Achilles tendinopathy",
  "adductor-strain": "Adductor strain",
  "adductor-tendon-rupture": "Adductor tendon rupture",
  "adductor-tendinopathy": "Adductor tendinopathy",
  "ankle-fracture": "Ankle fracture",
  "ankle-impingement": "Ankle impingement",
  "ankle-osteoarthritis": "Ankle osteoarthritis",
  "ankle-sprain": "Ankle sprain",
  "anterior-cruciate-ligament-injury": "Anterior cruciate ligament injury",
  bursitis: "Bursitis",
  "calf-muscle-strain": "Calf muscle strain",
  "heel-spurs": "Heel spurs",
  "chondromalacia-patella": "Chondromalacia patella",
  "chronic-ankle-instability": "Chronic ankle instability",
  "fat-pad-syndrome": "Fat pad syndrome",
  "femoral-fracture": "Femoral fracture",
  "greater-trochanteric-pain-syndrome": "Greater trochanteric pain syndrome",
  "gluteal-tendinopathy": "Gluteal tendinopathy",
  "gluteal-strain": "Gluteal strain",
  "hamstring-strain": "Hamstring strain",
  "hamstring-tendon-tear": "Hamstring tendon tear",
  "hamstring-tendinopathy": "Hamstring tendinopathy",
  hernia: "Hernia",
  "hip-fracture": "Hip fracture",
  "hip-impingement": "Hip impingement",
  "hip-osteoarthritis": "Hip osteoarthritis",
  "hip-replacement": "Hip replacement",
  "iliotibial-band-syndrome": "Iliotibial band syndrome",
  "iliopsoas-tendinopathy": "Iliopsoas tendinopathy",
  "iliopsoas-strain": "Iliopsoas strain",
  "labral-tear": "Labral tear",
  "lateral-collateral-ligament-injury": "Lateral collateral ligament injury",
  "lisfranc-injury": "Lisfranc injury",
  "lower-back-pain": "Lower back pain",
  "medial-collateral-ligament-injury": "Medial collateral ligament injury",
  "meniscus-tear": "Meniscus tear",
  "metatarsal-fracture": "Metatarsal fracture",
  "mortons-neuroma": "Morton’s neuroma",
  "osgood-schlatter-disease": "Osgood-Schlatter disease",
  osteoporosis: "Osteoporosis",
  "osteochondritis-dissecans": "Osteochondritis dissecans",
  "patellar-dislocation": "Patellar dislocation",
  "patellar-fracture": "Patellar fracture",
  "patellar-tendinopathy": "Patellar tendinopathy",
  "patellofemoral-pain-syndrome": "Patellofemoral pain syndrome",
  "peroneal-tendinopathy": "Peroneal tendinopathy",
  "piriformis-syndrome": "Piriformis syndrome",
  "plantar-fasciitis": "Plantar fasciitis",
  "plantar-heel-pain": "Plantar heel pain",
  "popliteus-strain": "Popliteus strain",
  "popliteus-tendinopathy": "Popliteus tendinopathy",
  "posterior-cruciate-ligament-injury": "Posterior cruciate ligament injury",
  "quadriceps-contusion": "Quadriceps contusion",
  "quadriceps-strain": "Quadriceps strain",
  "quadriceps-tendon-tear": "Quadriceps tendon tear",
  sciatica: "Sciatica",
  "severs-disease": "Sever’s disease",
  "shin-splints": "Shin splints",
  "stress-fracture": "Stress fracture",
  "sports-hernia": "Sports hernia",
  "tarsal-tunnel-syndrome": "Tarsal tunnel syndrome",
  "turf-toe": "Turf toe",
  "knee-replacement": "Knee replacement",
};

export const conditionOptions = Object.entries(conditions).map(
  ([value, label]) => ({
    value,
    label,
  })
);

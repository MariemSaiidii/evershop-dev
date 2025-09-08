pipeline {
    agent {
        kubernetes {
            cloud 'minikube-cloud'
            defaultContainer 'dind'
        }
    }

    environment {
        DOCKER_IMAGE = "mariem631/evershop"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                container('dind') {
                    git branch: 'main',
                        credentialsId: 'github-creds',
                        url: 'https://github.com/MariemSaiidii/evershop-dev.git'
                }
            }
        }

        stage('Build & Push Docker image') {
            steps {
                container('dind') {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
echo "Logging into DockerHub..."
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

echo "Building Docker image..."
docker build -t $DOCKER_IMAGE:$IMAGE_TAG ./evershop

echo "Pushing Docker image..."
docker push $DOCKER_IMAGE:$IMAGE_TAG

docker tag $DOCKER_IMAGE:$IMAGE_TAG $DOCKER_IMAGE:latest
docker push $DOCKER_IMAGE:latest
'''
                    }
                }
            }
        }

        stage('Update Helm values.yaml and push') {
            steps {
                container('dind') {
                    withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                        sh '''
set -e

git config user.email "ci@jenkins"
git config user.name "Jenkins CI"

sed -i 's|repository: .*|repository: '"$DOCKER_IMAGE"'|' helm/values.yaml
sed -i 's|tag: .*|tag: '"$IMAGE_TAG"'|' helm/values.yaml

git add helm/values.yaml
git commit -m "ci: update image to $DOCKER_IMAGE:$IMAGE_TAG" || echo "No changes to commit"

git remote set-url origin https://$GIT_USER:$GIT_PASS@github.com/MariemSaiidii/evershop-dev.git
git push origin main
'''
                    }
                }
            }
        }
    }
}
